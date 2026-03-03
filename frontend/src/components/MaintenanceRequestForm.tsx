"use client";

import { useState } from 'react';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';
import Notification, { useNotification } from './Notification';

const CATEGORIES = [
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Masonry',
    'Network/ICT',
    'Other'
];

const HALLS = [
    'V Hostel',
    'W Hostel',
    'X Hostel',
    'Y Hostel',
    'Z Hostel',
    'October Hall',
    'Africa Hall',
    'Non-Resident'
];

interface MaintenanceRequestFormProps {
    onSuccess?: () => void;
}

export default function MaintenanceRequestForm({ onSuccess }: MaintenanceRequestFormProps) {
    const { notification, showNotification, hideNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category: '',
        description: '',
        location: {
            hall: '',
            room: ''
        },
        priority: 'Medium'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.description || !form.location.hall) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/maintenance`, {
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

            showNotification('success', 'Maintenance report submitted successfully');
            setForm({
                category: '',
                description: '',
                location: { hall: '', room: '' },
                priority: 'Medium'
            });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            showNotification('error', err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔧</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Report Maintenance Issue</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category *</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            required
                        >
                            <option value="">Select Category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Priority</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={form.priority}
                            onChange={e => setForm({ ...form, priority: e.target.value })}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hall / Facility *</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={form.location.hall}
                            onChange={e => setForm({ ...form, location: { ...form.location, hall: e.target.value } })}
                            required
                        >
                            <option value="">Select Hall</option>
                            {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Room / Unit</label>
                        <input
                            type="text"
                            placeholder="e.g. Z101B or Y402A"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            value={form.location.room}
                            onChange={e => setForm({ ...form, location: { ...form.location, room: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description of Issue *</label>
                    <textarea
                        rows={3}
                        placeholder="Describe the problem in detail..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 dark:bg-emerald-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Submit Maintenance Request'}
                </button>
            </form>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}
