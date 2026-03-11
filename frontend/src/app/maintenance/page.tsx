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
        // Optimistic UI Update
        const previousReports = [...reports];
        setReports(reports.map(r => (r._id === reportId || r.id === reportId) ? { ...r, status: newStatus as any } : r));

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
            setReports(previousReports);
            showNotification('error', err.message || 'Failed to update status');
        }
    }

    async function assignToElectrician(reportId: string, electricianId: string, electricianName: string) {
        const previousReports = [...reports];
        setReports(reports.map(r => (r._id === reportId || r.id === reportId) ? {
            ...r,
            status: 'Assigned',
            assigned_to: { staff_id: electricianId, name: electricianName, role: 'electrician' }
        } : r));

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
            setReports(previousReports);
            showNotification('error', err.message || 'Failed to assign report');
        }
    }

    const isElectricalReport = (category: string) =>
        ['light', 'socket', 'ac', 'fan', 'fridge'].includes(category.toLowerCase());

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen font-sans">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-300 space-y-6">

                    {/* Maintenance Header */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Maintenance Management</h1>
                            <p className="text-sm text-gray-500 font-semibold mt-1">Manage university facility maintenance and repairs</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex-1 md:flex-none text-center md:text-left">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">Total Reports</span>
                                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{reports.length} Reports</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {/* Filters */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex gap-2 w-full md:w-auto">
                                <select
                                    className="flex-1 md:flex-none bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <select
                                    className="flex-1 md:flex-none bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="">All Priorities</option>
                                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="relative w-full md:w-96">
                                <input
                                    placeholder="Search maintenance reports..."
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-kmuGreen transition-all shadow-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Location</th>
                                        <th className="px-6 py-4 text-left">Issue Category</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredReports.map((r, i) => {
                                        const reportId = r._id || r.id;
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">{r.location?.hall}</div>
                                                    <div className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                                                        Room {r.location?.room || 'N/A'} • {r.reported_by?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold uppercase tracking-tight text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        {r.category}
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${r.priority === 'Urgent' ? 'bg-red-100 text-red-600 border-red-200' :
                                                            r.priority === 'High' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                                                            }`}>
                                                            {r.priority}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-1 leading-relaxed">
                                                        "{r.description}"
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <select
                                                        value={r.status}
                                                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                        className={`text-[10px] font-bold uppercase bg-transparent outline-none cursor-pointer border-b border-dotted transition-all ${r.status === 'Completed' ? 'text-emerald-600 border-emerald-400' : 'text-blue-600 border-blue-400'
                                                            }`}
                                                    >
                                                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        {isElectricalReport(r.category) && r.status === 'Reported' && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assign Technician</span>
                                                                <select
                                                                    className="text-[9px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-kmuGreen transition-all"
                                                                    onChange={(e) => {
                                                                        const elec = electricians.find(el => (el._id || el.id) === e.target.value);
                                                                        if (elec) assignToElectrician(reportId!, elec._id || elec.id, elec.name);
                                                                    }}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>Select...</option>
                                                                    {electricians.map(el => <option key={el._id || el.id} value={el._id || el.id}>{el.name}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                        {r.assigned_to?.name ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Technician Assigned</span>
                                                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase">{r.assigned_to.name}</span>
                                                            </div>
                                                        ) : !isElectricalReport(r.category) ? (
                                                            <span className="text-[9px] text-gray-300 italic uppercase tracking-widest">General Repair</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredReports.length === 0 && (
                                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/20">
                                    <div className="text-3xl mb-3">🔍</div>
                                    <div className="text-gray-400 italic text-sm">No maintenance reports found matching your search.</div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/20 text-center border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">KMU Maintenance System</span>
                        </div>
                    </div>
                </div>
            </div>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
