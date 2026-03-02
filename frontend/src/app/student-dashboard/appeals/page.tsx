"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';

interface Appeal {
    _id: string;
    reportId: string;
    reason: string;
    status: string;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
}

export default function StudentAppealsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, hideNotification } = useNotification();

    const [appeals, setAppeals] = useState<Appeal[]>([]);
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
            fetchAppeals();
        }
    }, [user?.studentId]);

    const fetchAppeals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, {
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setAppeals(data.appeals || []);
            }
        } catch (err: any) {
            console.error('Failed to fetch appeals:', err);
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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">My Appeals</h1>
                            <p className="text-sm text-gray-500 font-semibold mt-1">Monitor the status of your disciplinary appeals</p>
                        </div>
                        <Link href="/student-dashboard" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="space-y-4">
                            {appeals.map((appeal) => (
                                <div key={appeal._id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">Appeal Ref: {appeal._id.substring(0, 8).toUpperCase()}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Submitted: {formatDate(appeal.createdAt)}</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] uppercase border border-orange-200">
                                            {appeal.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mb-3">"{appeal.reason}"</p>
                                    {appeal.adminResponse && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] font-bold text-green-600 uppercase mb-1.5 tracking-wider">Dean Response:</p>
                                            <p className="text-xs text-gray-800 dark:text-gray-200 font-medium">{appeal.adminResponse}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {appeals.length === 0 && (
                                <div className="text-center py-16 text-gray-400 italic border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">No appeals found.</div>
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
