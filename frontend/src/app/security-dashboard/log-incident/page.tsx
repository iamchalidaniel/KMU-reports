"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';
import CaseDossierForm from '../../../components/CaseDossierForm';
import Link from 'next/link';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';

export default function LogIncidentPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        if (!authLoading && (!token || user?.role !== 'security_officer')) {
            router.replace('/login');
        }
    }, [authLoading, token, user, router]);

    if (authLoading || !user) {
        return <div className="p-12 text-center text-kmuGreen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 text-sm">
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Record Incident</h1>
                        <p className="text-gray-500 mt-1">Submit case details for review and processing.</p>
                    </div>
                    <Link href="/security-dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="text-xl">✕</span>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <CaseDossierForm
                        onSuccess={() => {
                            showNotification('success', 'Incident logged successfully');
                            setTimeout(() => router.push('/security-dashboard'), 2000);
                        }}
                        onCancel={() => router.push('/security-dashboard')}
                    />
                </div>
            </div>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
