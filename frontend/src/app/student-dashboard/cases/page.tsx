"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';

interface Case {
    _id: string;
    incidentDate: string;
    description: string;
    offenseType: string;
    severity: string;
    status: string;
    sanctions?: string;
    createdAt: string;
}

export default function StudentCasesPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, hideNotification } = useNotification();

    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
            return;
        }
        if (!authLoading && user && user.role !== 'student') {
            router.replace('/');
            return;
        }
    }, [authLoading, token, user, router]);

    useEffect(() => {
        if (user?.studentId) {
            fetchCases();
        }
    }, [user?.studentId]);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cases?studentId=${user?.studentId}`, {
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setCases(Array.isArray(data) ? data : (data.cases || []));
        } catch (err: any) {
            console.error('Failed to fetch cases:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-kmuGreen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kmuGreen"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Disciplinary Record</h1>
                            <p className="text-sm text-gray-500 font-semibold mt-1">View details of disciplinary cases against you</p>
                        </div>
                        <Link href="/student-dashboard" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">Offense Category</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {cases.map((c) => (
                                        <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">{formatDate(c.incidentDate)}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold uppercase text-gray-900 dark:text-gray-100">{c.offenseType}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">{c.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-[10px] uppercase border border-red-200">
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-all">View Details →</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {cases.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No disciplinary cases found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
