"use client";

import { useState } from 'react';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';
import Notification, { useNotification } from './Notification';

const OFFENSE_TYPES = [
    'Theft',
    'Assault',
    'Property Damage',
    'Noise Complaint',
    'Harassment',
    'Drugs/Alcohol',
    'Other'
];

interface IncidentReportFormProps {
    onSuccess?: () => void;
}

export default function IncidentReportForm({ onSuccess }: IncidentReportFormProps) {
    const { notification, showNotification, hideNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        incident_date: new Date().toISOString().split('T')[0],
        description: '',
        offense_type: '',
        severity: 'Medium',
        is_anonymous: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.offense_type || !form.description) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/student-reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders()
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            showNotification('Incident report submitted successfully', 'success');
            setForm({
                incident_date: new Date().toISOString().split('T')[0],
                description: '',
                offense_type: '',
                severity: 'Medium',
                is_anonymous: false
            });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            showNotification(err.message || 'Failed to submit report', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🚨</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Report Incident / Concern</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Type of Incident *</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            value={form.offense_type}
                            onChange={e => setForm({ ...form, offense_type: e.target.value })}
                            required
                        >
                            <option value="">Select Category</option>
                            {OFFENSE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Incident Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            value={form.incident_date}
                            onChange={e => setForm({ ...form, incident_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Statement *</label>
                    <textarea
                        rows={3}
                        placeholder="Provide a clear and concise account of the incident..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        required
                    />
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <input
                        type="checkbox"
                        id="anonymous"
                        className="w-4 h-4 text-indigo-600 rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                        checked={form.is_anonymous}
                        onChange={e => setForm({ ...form, is_anonymous: e.target.checked })}
                    />
                    <label htmlFor="anonymous" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Submit anonymously (Identity will be hidden from staff)</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                    {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Submit Statement'}
                </button>
            </form>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
