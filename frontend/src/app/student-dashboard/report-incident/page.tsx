"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';
import IncidentReportForm from '../../../components/IncidentReportForm';
import Link from 'next/link';

export default function ReportIncidentPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        if (!authLoading && (!token || user?.role !== 'student')) {
            router.replace('/login');
        }
    }, [authLoading, token, user, router]);

    if (authLoading || !user) {
        return <div className="p-12 text-center text-kmuGreen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 text-sm">
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Report Incident</h1>
                        <p className="text-gray-500 mt-1">Submit a formal incident report to university security.</p>
                    </div>
                    <Link href="/student-dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="text-xl">✕</span>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <IncidentReportForm onSuccess={() => {
                        showNotification('success', 'Incident reported successfully');
                        setTimeout(() => router.push('/student-dashboard'), 2000);
                    }} />
                </div>
            </div>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
