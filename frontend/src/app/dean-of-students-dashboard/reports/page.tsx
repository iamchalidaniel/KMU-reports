"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { fetchWithAuth, authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../../components/Notification';
import { saveAs } from 'file-saver';

export default function DeanOfStudentsReports() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    async function generateFullReport() {
        try {
            setExporting(true);
            const res = await fetch(`${API_BASE_URL}/reports/dashboard-cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    pageInfo: { title: 'Dean of Students - Annual behavioral Review', url: window.location.href }
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            saveAs(blob, 'dean_annual_behavioral_review.docx');
            showNotification('success', 'Annual review generated successfully!');
        } catch (err) {
            showNotification('error', 'Generation failed');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Advanced Reports & Analytics</h1>
                        <p className="text-sm text-gray-500 font-bold uppercase">Generate comprehensive behavioral intelligence dossiers</p>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/50 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between" onClick={generateFullReport}>
                                <div>
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📊</div>
                                    <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Annual behavioral Dossier</h3>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">Export a complete consolidated report of all disciplinary cases, severities, and trends across the entire university.</p>
                                </div>
                                <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-emerald-600 outline outline-1 outline-emerald-600/30 rounded-full px-3 py-1 w-fit">DOCX EXPORT</div>
                            </div>

                            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 grayscale opacity-60 cursor-not-allowed">
                                <div>
                                    <div className="text-4xl mb-4">📈</div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">AI Predictive Modeling</h3>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">Predict future behavioral trends based on historical incident data. (Module under maintenance)</p>
                                </div>
                            </div>
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
