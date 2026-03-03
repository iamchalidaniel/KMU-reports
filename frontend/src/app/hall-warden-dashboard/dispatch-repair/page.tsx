"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import Link from 'next/link';

const CATEGORIES = [
    { value: 'fridge', label: 'Refrigerator' },
    { value: 'light', label: 'Lighting' },
    { value: 'socket', label: 'Electrical Socket' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'door', label: 'Door' },
    { value: 'window', label: 'Window' },
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'fan', label: 'Fan' },
    { value: 'other', label: 'Other' },
];

const PRIORITIES = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
];

export default function DispatchRepairPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        hall: '',
        room: '',
        floor: '',
        building: '',
        description: '',
        priority: 'Medium',
        reported_by_name: '',
        reported_by_contact: '',
    });

    useEffect(() => {
        if (!authLoading && (!token || user?.role !== 'hall_warden')) {
            router.replace('/login');
        }
    }, [authLoading, token, user, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/maintenance`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    reported_by: { name: formData.reported_by_name, contact: formData.reported_by_contact },
                    location: { hall: formData.hall, room: formData.room, floor: formData.floor, building: formData.building },
                    status: 'Reported',
                }),
            });

            if (res.ok) {
                showNotification('success', 'Maintenance report submitted');
                setTimeout(() => router.push('/hall-warden-dashboard'), 2000);
            } else {
                throw new Error('Failed to submit report');
            }
        } catch (err) {
            showNotification('error', 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    }

    if (authLoading || !user) {
        return <div className="p-12 text-center text-kmuGreen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 text-sm">
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dispatch Repair</h1>
                        <p className="text-gray-500 mt-1">Submit infrastructure failure details for immediate technical attention.</p>
                    </div>
                    <Link href="/hall-warden-dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="text-xl">✕</span>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Category" value={formData.category} onChange={(v: string) => setFormData({ ...formData, category: v })} type="select" options={CATEGORIES} />
                            <FormField label="Priority" value={formData.priority} onChange={(v: string) => setFormData({ ...formData, priority: v })} type="select" options={PRIORITIES} />
                            <FormField label="Hall" value={formData.hall} onChange={(v: string) => setFormData({ ...formData, hall: v })} />
                            <FormField label="Room" value={formData.room} onChange={(v: string) => setFormData({ ...formData, room: v })} />
                            <div className="md:col-span-2">
                                <FormField label="Description" value={formData.description} onChange={(v: string) => setFormData({ ...formData, description: v })} type="textarea" />
                            </div>
                            <FormField label="Reported By" value={formData.reported_by_name} onChange={(v: string) => setFormData({ ...formData, reported_by_name: v })} />
                            <FormField label="Contact" value={formData.reported_by_contact} onChange={(v: string) => setFormData({ ...formData, reported_by_contact: v })} />
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-emerald-700 transition">
                                {loading ? 'Processing...' : 'Authorize Dispatch'}
                            </button>
                            <button type="button" onClick={() => router.push('/hall-warden-dashboard')} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {notification?.isVisible && (
                <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
            )}
        </div>
    );
}

function FormField({ label, value, onChange, type = 'text', options = [] }: any) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            {type === 'select' ? (
                <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none transition-all text-xs font-bold">
                    <option value="">Select...</option>
                    {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            ) : type === 'textarea' ? (
                <textarea value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none min-h-[100px] transition-all text-xs" />
            ) : (
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none transition-all text-xs font-bold" />
            )}
        </div>
    );
}
