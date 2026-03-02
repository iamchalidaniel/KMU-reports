"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';

export default function StudentProfilePage() {
    const { user, token, loading: authLoading, changePassword } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ username: '', name: '' });

    // Password change states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

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
        async function fetchFullProfile() {
            setLoading(true);
            try {
                const data = await getProfile();
                setProfile(data);
                setForm({ username: data.username || '', name: data.name || '' });
            } catch (err) {
                console.error('Failed to fetch full profile:', err);
            } finally {
                setLoading(false);
            }
        }
        if (token) {
            fetchFullProfile();
        }
    }, [token]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        try {
            await updateProfile(form);
            showNotification('Profile updated successfully', 'success');
            setEditMode(false);
            const data = await getProfile();
            setProfile(data);
        } catch (err: any) {
            showNotification(err.message || 'Synchronization failure', 'error');
        }
    }

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        try {
            const success = await changePassword(oldPassword, newPassword);
            if (success) {
                showNotification('Security credentials updated', 'success');
                setOldPassword('');
                setNewPassword('');
            } else {
                showNotification('Credential update failed', 'error');
            }
        } catch (err: any) {
            showNotification(err.message || 'Credential update failed', 'error');
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-kmuGreen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kmuGreen"></div>
            </div>
        );
    }

    const studentData = profile || user;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-300 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Official Student Record</h1>
                            <p className="text-sm text-gray-500 font-semibold mt-1">Manage your academic profile and account security</p>
                        </div>
                        <Link href="/student-dashboard" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Record Information */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Student Bio-Data</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoField label="Academic Program" value={studentData.program} />
                                    <InfoField label="Year of Study" value={studentData.yearOfStudy} />
                                    <InfoField label="Delivery Mode" value={studentData.deliveryMode} />
                                    <InfoField label="Gender" value={studentData.gender} />
                                    <InfoField label="NRC Number" value={studentData.nrc} />
                                    <InfoField label="Contact Mobile" value={studentData.phone} />
                                    <InfoField label="University Email" value={studentData.email} />
                                    <InfoField label="Residential Unit" value={studentData.roomNo || 'Non-Resident'} />
                                    <InfoField label="Registry Status" value={studentData.status || 'ACTIVE'} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Account Identity</h3>
                                {editMode ? (
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                            <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-sm">Save Changes</button>
                                            <button type="button" onClick={() => setEditMode(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold text-[10px] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase tracking-widest">Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Username</h4>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{studentData.username || 'Not Set'}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</h4>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{studentData.fullName || studentData.name || 'Not Set'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setEditMode(true)} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-[10px] rounded-lg hover:opacity-90 transition-all uppercase tracking-widest shadow-sm">Edit Profile Information</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 overflow-hidden relative self-start">
                            <h2 className="text-lg font-bold uppercase tracking-tight text-red-600 mb-8">Security Settings</h2>
                            <form onSubmit={handlePasswordChange} className="space-y-6 relative z-10">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none transition" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none transition" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="px-8 py-3 bg-red-600 text-white font-bold text-[10px] rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest shadow-sm flex items-center gap-2">
                                    🔒 Update Password
                                </button>
                            </form>

                            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Password Safety</h4>
                                <ul className="text-[10px] text-gray-500 space-y-2 font-bold uppercase tracking-tight">
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Change your password every 90 days.</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Avoid using simple or obvious passwords.</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> All security actions are logged.</li>
                                </ul>
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

function InfoField({ label, value }: any) {
    return (
        <div className="flex flex-col gap-1 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-500/20 transition-all">
            <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">{label}</label>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                {value || 'Not Registered'}
            </div>
        </div>
    );
}
