"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../components/Notification';

interface MaintenanceReport {
    _id?: string;
    id?: string;
    category: string;
    location: {
        hall: string;
        room?: string;
        floor?: string;
        building?: string;
    };
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Reported' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
    reported_by: {
        student_id?: string;
        staff_id?: string;
        name: string;
        contact?: string;
    };
    assigned_to?: {
        staff_id?: string;
        name?: string;
        role?: string;
    };
    created_at: string;
    updated_at: string;
}

const STATUSES = [
    { value: 'Reported', label: 'Reported' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

const PRIORITIES = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
];

export default function AdminMaintenancePage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [reports, setReports] = useState<MaintenanceReport[]>([]);
    const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [electricians, setElectricians] = useState<any[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!authLoading && !token) {
                router.replace('/login');
                return;
            }
            if (!authLoading && user && user.role !== 'admin') {
                router.replace('/admin');
                return;
            }
        }
    }, [authLoading, token, user, router]);

    useEffect(() => {
        if (token && user?.role === 'admin') {
            fetchReports();
            fetchElectricians();
        }
    }, [token, user]);

    useEffect(() => {
        let result = [...reports];
        if (search) {
            result = result.filter(r =>
                r.description.toLowerCase().includes(search.toLowerCase()) ||
                r.location.hall.toLowerCase().includes(search.toLowerCase()) ||
                r.location.room?.toLowerCase().includes(search.toLowerCase()) ||
                r.reported_by.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }
        if (priorityFilter) {
            result = result.filter(r => r.priority === priorityFilter);
        }
        setFilteredReports(result);
    }, [search, statusFilter, priorityFilter, reports]);

    async function fetchReports() {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/maintenance`, {
                headers: { ...authHeaders() }
            });
            if (!res.ok) throw new Error('Failed to fetch reports');
            const data = await res.json();
            setReports(data.reports || data || []);
        } catch (err: any) {
            showNotification('error', err.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }

    async function fetchElectricians() {
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: { ...authHeaders() }
            });
            if (res.ok) {
                const data = await res.json();
                const electricianUsers = (data.users || data || []).filter((u: any) => u.role === 'electrician');
                setElectricians(electricianUsers);
            }
        } catch (err) {
            console.error('Failed to fetch electricians:', err);
        }
    }

    async function updateStatus(reportId: string, newStatus: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
                method: 'PUT',
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            showNotification('success', 'Status updated successfully');
            fetchReports();
        } catch (err: any) {
            showNotification('error', err.message || 'Failed to update status');
        }
    }

    async function assignToElectrician(reportId: string, electricianId: string, electricianName: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
                method: 'PUT',
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'Assigned',
                    assigned_to: {
                        staff_id: electricianId,
                        name: electricianName,
                        role: 'electrician'
                    }
                }),
            });
            if (!res.ok) throw new Error('Failed to assign report');
            showNotification('success', `Assigned to ${electricianName}`);
            fetchReports();
        } catch (err: any) {
            showNotification('error', err.message || 'Failed to assign report');
        }
    }

    const isElectricalReport = (category: string) =>
        ['light', 'socket', 'ac', 'fan', 'fridge'].includes(category.toLowerCase());

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Maintenance Reports</h1>
                <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{reports.length} Total Reports</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <input
                        placeholder="Search hall, room, or reporter..."
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                            <tr>
                                <th className="px-4 py-4 text-left">Location / Info</th>
                                <th className="px-4 py-4 text-left">Category / Priority</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredReports.map((r, i) => {
                                const reportId = r._id || r.id;
                                return (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                        <td className="px-4 py-4">
                                            <div className="font-bold">{r.location?.hall}</div>
                                            <div className="text-[10px] text-gray-400">Room {r.location?.room || 'N/A'} • {r.reported_by?.name}</div>
                                            <div className="mt-1 text-gray-600 dark:text-gray-400 italic line-clamp-1">{r.description}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium uppercase">{r.category}</div>
                                            <div className={`mt-1 text-[9px] font-bold uppercase ${r.priority === 'Urgent' ? 'text-red-600' :
                                                    r.priority === 'High' ? 'text-orange-600' : 'text-gray-400'
                                                }`}>{r.priority} Priority</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <select
                                                value={r.status}
                                                onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                className={`text-[10px] font-bold border rounded px-2 py-1 bg-transparent ${r.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                                    }`}
                                            >
                                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {isElectricalReport(r.category) && r.status === 'Reported' && (
                                                <select
                                                    className="text-[9px] bg-gray-100 dark:bg-gray-700 border-none rounded px-2 py-1"
                                                    onChange={(e) => {
                                                        const elec = electricians.find(el => (el._id || el.id) === e.target.value);
                                                        if (elec) assignToElectrician(reportId!, elec._id || elec.id, elec.name);
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Assign Electrician</option>
                                                    {electricians.map(el => <option key={el._id || el.id} value={el._id || el.id}>{el.name}</option>)}
                                                </select>
                                            )}
                                            {r.assigned_to?.name && (
                                                <div className="text-[9px] text-gray-500">Assigned to: {r.assigned_to.name}</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-500 italic">No maintenance reports found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
