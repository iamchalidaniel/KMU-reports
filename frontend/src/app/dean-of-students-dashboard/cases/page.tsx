"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { fetchWithAuth, authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../../components/Notification';
import { saveAs } from 'file-saver';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    program?: string;
}

interface Case {
    _id: string;
    student?: Student;
    offenseType: string;
    severity: string;
    status: string;
    createdAt: string;
    description: string;
}

export default function DeanOfStudentsCases() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [cases, setCases] = useState<Case[]>([]);
    const [filteredCases, setFilteredCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        async function fetchCases() {
            try {
                setLoading(true);
                const data = await fetchWithAuth(`${API_BASE_URL}/cases`);
                const casesArray = Array.isArray(data) ? data : (data.cases || data || []);
                setCases(casesArray);
            } catch (err) {
                console.error('Failed to fetch cases:', err);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchCases();
        }
    }, [token]);

    useEffect(() => {
        let result = cases;
        if (search) {
            result = result.filter((c: any) =>
                c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
                c.offenseType?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (statusFilter) {
            result = result.filter((c: any) => c.status === statusFilter);
        }
        setFilteredCases(result);
    }, [search, statusFilter, cases]);

    async function exportToWord() {
        try {
            setExporting(true);
            const res = await fetch(`${API_BASE_URL}/reports/dashboard-cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    pageInfo: { title: 'Dean of Students - Disciplinary Cases Ledger', url: window.location.href }
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            saveAs(blob, 'dean_of_students_cases_ledger.docx');
            showNotification('success', 'Ledger exported successfully!');
        } catch (err) {
            showNotification('error', 'Export failed');
        } finally {
            setExporting(false);
        }
    }

    if (authLoading || loading) {
        return <div className="text-center p-12 text-kmuGreen uppercase font-bold tracking-widest">Loading behavioral records...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight">Disciplinary cases Ledger</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">Dean of Students behavioral Oversight</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportToWord}
                                disabled={exporting}
                                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm hover:opacity-90 disabled:opacity-50"
                            >
                                {exporting ? 'Exporting...' : '📄 Export Ledger'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <input
                                    placeholder="Search students, IDs, or offenses..."
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all flex-1 md:flex-none"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="Under Investigation">Investigation</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            
                            {/* Desktop Table View */}
                            <table className="w-full text-sm font-sans hidden md:table">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Student Information</th>
                                        <th className="px-6 py-4 text-left">Offense Category</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredCases.map((c, i) => (
                                        <tr
                                            key={c._id || i}
                                            className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 group transition-colors cursor-pointer"
                                            onClick={() => router.push(`/cases/${c._id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                                    {c.student?.fullName || 'Anonymous'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold mt-0.5">{c.student?.studentId} • {c.student?.program}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-700 dark:text-gray-300 font-bold uppercase text-xs">{c.offenseType}</div>
                                                <div className="text-[9px] text-gray-400 mt-1 uppercase line-clamp-1 italic">{c.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${c.status === 'Open' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                        c.status === 'Closed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[10px] font-black uppercase ${c.severity === 'Critical' ? 'text-red-600 animate-pulse' : c.severity === 'High' ? 'text-red-500' : 'text-gray-400'}`}>{c.severity}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 font-sans">
                                {filteredCases.map((c, i) => (
                                    <div 
                                        key={c._id || i} 
                                        className="p-4 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 group transition-colors cursor-pointer"
                                        onClick={() => router.push(`/cases/${c._id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                                    {c.student?.fullName || 'Anonymous'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold mt-0.5">{c.student?.studentId} • {c.student?.program}</div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${c.status === 'Open' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                c.status === 'Closed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3 border-l-2 border-emerald-400">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-gray-700 dark:text-gray-300 font-bold uppercase text-xs">{c.offenseType}</div>
                                                <span className={`text-[10px] font-black uppercase ${c.severity === 'Critical' ? 'text-red-600 animate-pulse' : c.severity === 'High' ? 'text-red-500' : 'text-gray-400'}`}>{c.severity}</span>
                                            </div>
                                            <div className="text-[9px] text-gray-400 mt-1 uppercase line-clamp-2 italic">{c.description}</div>
                                        </div>
                                        
                                        <div className="flex justify-end items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                                            <span className="text-emerald-600 text-xs font-bold uppercase group-hover:underline">View details →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {filteredCases.length === 0 && (
                                <div className="text-center py-24 text-gray-400 italic text-sm font-sans uppercase tracking-widest">No matching case records found.</div>
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
