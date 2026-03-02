"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { fetchWithAuth } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../../components/Notification';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    program: string;
}

export default function AssistantDeanStudents() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('');

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        async function fetchStudents() {
            try {
                setLoading(true);
                const data = await fetchWithAuth(`${API_BASE_URL}/students`);
                const studentsArray = Array.isArray(data) ? data : (data.students || data || []);
                setStudents(studentsArray);
            } catch (err) {
                console.error('Failed to fetch students:', err);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchStudents();
        }
    }, [token]);

    useEffect(() => {
        let result = students;
        if (search) {
            result = result.filter((s: any) =>
                s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                s.studentId?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (programFilter) {
            result = result.filter((s: any) => s.program === programFilter);
        }
        setFilteredStudents(result);
    }, [search, programFilter, students]);

    const programs = Array.from(new Set(students.map((s: any) => s.program).filter(Boolean)));

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen uppercase font-bold tracking-widest">Loading Registry...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight">Student Registry</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Full directory of enrolled students and academic profiles</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <input
                                    placeholder="Search name or student ID..."
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-kmuGreen transition-all font-sans"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <select
                                    value={programFilter}
                                    onChange={(e) => setProgramFilter(e.target.value)}
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-kmuGreen transition-all flex-1 md:flex-none"
                                >
                                    <option value="">All Programs</option>
                                    {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-sans">
                            {filteredStudents.map((s, i) => (
                                <div
                                    key={s._id || i}
                                    className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-kmuGreen/50 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => router.push(`/students/${s._id}`)}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 font-bold group-hover:scale-110 transition-transform">
                                            {s.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs uppercase dark:text-gray-100 group-hover:text-kmuGreen transition-colors line-clamp-1">{s.fullName}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{s.studentId}</div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{s.program}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredStudents.length === 0 && (
                                <div className="col-span-full text-center py-24 text-gray-400 italic text-sm font-sans uppercase tracking-widest">No student records found.</div>
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
