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
    updated_at: string;
}

const ELECTRICAL_CATEGORIES = [
    { value: 'light', label: 'Lighting' },
    { value: 'socket', label: 'Electrical Socket' },
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'fan', label: 'Fan' },
    { value: 'fridge', label: 'Refrigerator' },
    { value: 'other', label: 'Other Electrical' },
];

const STATUSES = [
    { value: 'Reported', label: 'Reported' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function ElectricianTasks() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [reports, setReports] = useState<MaintenanceReport[]>([]);
    const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        async function fetchReports() {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/maintenance`, {
                    headers: { ...authHeaders() }
                });
                if (!res.ok) throw new Error('Failed to fetch reports');
                const data = await res.json();
                const electricalReports = (data.reports || data || []).filter((r: MaintenanceReport) =>
                    ELECTRICAL_CATEGORIES.some(cat => cat.value === r.category)
                );
                setReports(electricalReports);
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchReports();
        }
    }, [token]);

    useEffect(() => {
        let filtered = [...reports];
        if (search) {
            filtered = filtered.filter(r =>
                r.description.toLowerCase().includes(search.toLowerCase()) ||
                r.location.room?.toLowerCase().includes(search.toLowerCase()) ||
                r.location.hall?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
        setFilteredReports(filtered);
    }, [search, statusFilter, reports]);

    async function updateStatus(reportId: string, newStatus: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
                method: 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');

            showNotification('success', 'Status updated successfully');
            setReports(reports.map(r => (r._id === reportId || r.id === reportId) ? { ...r, status: newStatus as any } : r));
        } catch (err: any) {
            showNotification('error', 'Update failed');
        }
    }

    if (authLoading || loading) {
        return <div className="text-center p-12 text-blue-600 uppercase font-black tracking-widest">Retrieving technical data...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Technical Task Ledger</h1>
                            <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1">Electrical Maintenance Registry</p>
                        </div>
                        <Link href="/electrician-dashboard" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest transition-all">← Dashboard Overview</Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Search location or failure details..."
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase w-full md:w-96 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-8 py-6 text-left">Location Telemetry</th>
                                        <th className="px-8 py-6 text-left">Failure Specification</th>
                                        <th className="px-8 py-6 text-center">Status Control</th>
                                        <th className="px-8 py-6 text-right">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {filteredReports.map((report, i) => {
                                        const reportId = report._id || report.id;
                                        return (
                                            <tr key={reportId} className="hover:bg-blue-50/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                        {report.location.hall}
                                                    </div>
                                                    <div className="text-[9px] font-black text-gray-400 mt-1 uppercase">Unit {report.location.room || 'N/A'}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-gray-700 dark:text-gray-300 uppercase text-[10px] mb-1">{report.category}</div>
                                                    <div className="text-[10px] text-gray-400 italic line-clamp-1 italic">"{report.description}"</div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                        className={`text-[9px] font-black uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer hover:underline transition-all ${report.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-white dark:bg-gray-900 font-sans">{s.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-[9px] text-gray-300 uppercase tracking-widest">
                                                    {reportId?.slice(-8).toUpperCase()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredReports.length === 0 && (
                                <div className="text-center py-32 text-gray-400 italic font-black uppercase tracking-widest">No technical tasks recorded.</div>
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
