"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../../components/Notification';

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
}

const STATUSES = [
    { value: 'Reported', label: 'Reported' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function HallWardenMaintenance() {
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
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [repRes, elecRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } }),
                    fetch(`${API_BASE_URL}/users`, { headers: { ...authHeaders() } })
                ]);

                if (repRes.ok) {
                    const data = await repRes.json();
                    setReports(data.reports || data || []);
                }
                if (elecRes.ok) {
                    const data = await elecRes.json();
                    setElectricians((data.users || data || []).filter((u: any) => u.role === 'electrician'));
                }
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchData();
        }
    }, [token]);

    useEffect(() => {
        let filtered = [...reports];
        if (search) {
            filtered = filtered.filter(r =>
                r.description.toLowerCase().includes(search.toLowerCase()) ||
                r.location.hall?.toLowerCase().includes(search.toLowerCase()) ||
                r.location.room?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
        if (priorityFilter) filtered = filtered.filter(r => r.priority === priorityFilter);

        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setFilteredReports(filtered);
    }, [search, statusFilter, priorityFilter, reports]);

    async function updateStatus(reportId: string, newStatus: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
                method: 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                showNotification('success', 'Status updated successfully');
                const updated = reports.map(r => (r._id === reportId || r.id === reportId) ? { ...r, status: newStatus as any } : r);
                setReports(updated);
            }
        } catch (err) {
            showNotification('error', 'Update failed');
        }
    }

    async function assignToElectrician(reportId: string, electricianId: string, electricianName: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
                method: 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Assigned',
                    assigned_to: { staff_id: electricianId, name: electricianName, role: 'electrician' }
                }),
            });
            if (res.ok) {
                showNotification('success', 'Assigned to technician');
                const updated = reports.map(r => (r._id === reportId || r.id === reportId) ? { ...r, status: 'Assigned' as any, assigned_to: { staff_id: electricianId, name: electricianName, role: 'electrician' } } : r);
                setReports(updated);
            }
        } catch (err) {
            showNotification('error', 'Assignment failed');
        }
    }

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen uppercase font-bold tracking-widest">Accessing maintenance logs...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight">Full maintenance Ledger</h1>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Hostel Infrastructure oversight</p>
                        </div>
                        <Link href="/hall-warden-dashboard" className="text-xs font-bold text-kmuGreen hover:underline uppercase tracking-widest">← Back to Overview</Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden font-sans">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                placeholder="Search description or location..."
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase font-bold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                                <option value="">All Statuses</option>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                                <option value="">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-5 text-left">Location / Unit</th>
                                        <th className="px-6 py-5 text-left">Issue / Description</th>
                                        <th className="px-6 py-5 text-center">Current Status</th>
                                        <th className="px-6 py-5 text-right">Technical Dispatch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredReports.map((report, i) => {
                                        const reportId = report._id || report.id;
                                        return (
                                            <tr key={reportId} className="hover:bg-emerald-50/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{report.location.hall}</div>
                                                    <div className="text-[10px] text-emerald-600 font-bold mt-1">Room {report.location.room || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold uppercase text-gray-700 dark:text-gray-300">{report.category}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${report.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                                report.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>{report.priority}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 italic line-clamp-1">"{report.description}"</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                        className={`text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer hover:text-emerald-500 transition-all ${report.status === 'Completed' ? 'text-green-600 underline' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-white dark:bg-gray-900">{s.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {report.assigned_to?.name ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Technician</span>
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase">{report.assigned_to.name}</span>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            className="text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                                            onChange={(e) => {
                                                                const elec = electricians.find(el => el._id === e.target.value);
                                                                if (elec) assignToElectrician(reportId!, elec._id, elec.name);
                                                            }}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Dispatch Tech</option>
                                                            {electricians.map(el => <option key={el._id} value={el._id}>{el.name}</option>)}
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredReports.length === 0 && (
                                <div className="text-center py-32 text-gray-400 italic text-sm font-sans uppercase tracking-widest">No matching infrastructure reports found.</div>
                            )}
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
