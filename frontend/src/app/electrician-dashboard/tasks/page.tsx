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
        const previousReports = [...reports];
        setReports(reports.map(r => (r._id === reportId || r.id === reportId) ? { ...r, status: newStatus as any } : r));

        try {
            const res = await fetch(`${API_BASE_URL}/maintenance/${reportId}`, {
                method: 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');

            showNotification('success', 'Status updated successfully');
        } catch (err: any) {
            setReports(previousReports);
            showNotification('error', 'Update failed');
        }
    }

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen font-medium">Loading your tasks...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Electrical Tasks</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your assigned maintenance work</p>
                        </div>
                        <Link href="/electrician-dashboard" className="text-sm font-medium text-kmuGreen hover:underline transition-all">← Back to Dashboard</Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Search by location or description..."
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm w-full md:w-96 focus:ring-2 focus:ring-kmuGreen outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-kmuGreen outline-none transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            
                            {/* Desktop Table View */}
                            <table className="w-full text-xs hidden md:table">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Location</th>
                                        <th className="px-6 py-4 text-left">Issue</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {filteredReports.map((report, i) => {
                                        const reportId = report._id || report.id;
                                        return (
                                            <tr key={reportId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {report.location.hall}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Room {report.location.room || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1 capitalize">{report.category}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{report.description}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                        className={`text-sm font-medium bg-transparent border-none outline-none cursor-pointer hover:underline transition-all ${
                                                            report.status === 'Completed' ? 'text-green-600' : report.status === 'In Progress' ? 'text-kmuGreen' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-white dark:bg-gray-900 font-sans">{s.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                    {reportId?.slice(-8).toUpperCase()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredReports.map((report, i) => {
                                    const reportId = report._id || report.id;
                                    return (
                                        <div key={reportId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {report.location.hall}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Room {report.location.room || 'N/A'}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    report.status === 'Completed' ? 'bg-green-100 text-green-700' : report.status === 'In Progress' ? 'bg-kmuGreen/10 text-kmuGreen' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3 border-l-2 border-kmuGreen">
                                                <div className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1 capitalize">{report.category}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{report.description}</div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status:</span>
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => updateStatus(reportId!, e.target.value)}
                                                    className={`text-sm font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded outline-none focus:ring-2 focus:ring-kmuGreen transition-all ${
                                                        report.status === 'Completed' ? 'text-green-600' : report.status === 'In Progress' ? 'text-kmuGreen' : 'text-gray-600'
                                                    }`}
                                                >
                                                    {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-white dark:bg-gray-900 font-sans">{s.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {filteredReports.length === 0 && (
                                <div className="text-center py-12 text-gray-500">No tasks found. Great job staying on top of maintenance!</div>
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
