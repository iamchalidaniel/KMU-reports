"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';
import { saveAs } from 'file-saver';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

export default function DeanOfStudentsReports() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();

    const [cases, setCases] = useState<Case[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [programFilter, setProgramFilter] = useState('');
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login');
        }
    }, [authLoading, token, router]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [casesRes, studentsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } }),
                    fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } })
                ]);

                if (casesRes.ok) {
                    const casesData = await casesRes.json();
                    setCases(casesData.cases || casesData || []);
                }
                if (studentsRes.ok) {
                    const studentsData = await studentsRes.json();
                    setStudents(studentsData.students || studentsData || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchData();
        }
    }, [token]);

    async function generateFullReport() {
        try {
            setExporting(true);
            const res = await fetch(`${API_BASE_URL}/reports/dashboard-cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    pageInfo: { title: 'Dean of Students Reports', url: window.location.href }
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            saveAs(blob, 'dean_students_report.docx');
            showNotification('success', 'Report generated successfully!');
        } catch (err) {
            showNotification('error', 'Generation failed');
        } finally {
            setExporting(false);
        }
    }

    const analyticsCases = programFilter ? cases.filter((c: any) => c.student?.program === programFilter) : cases;
    const offenseCounts: Record<string, number> = {};
    const offenderCounts: Record<string, number> = {};

    analyticsCases.forEach((c: Case) => {
        if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
        if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
    });

    const topOffenses = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const offenseChartData = {
        labels: topOffenses.map(([offence]) => offence),
        datasets: [{
            label: 'Offenses',
            data: topOffenses.map(([, count]) => count),
            backgroundColor: 'rgba(5, 150, 105, 0.7)',
            borderRadius: 8,
        }],
    };

    const programs = Array.from(new Set(students.map((s: any) => s.program).filter(Boolean)));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-in fade-in duration-500 space-y-6">

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">Reports & Analytics</h1>
                        <p className="text-sm text-gray-500">View trends and generate disciplinary reports</p>

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Case Analysis */}
                            <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Offense Distribution</h3>
                                    <select
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs"
                                        value={programFilter}
                                        onChange={(e) => setProgramFilter(e.target.value)}
                                    >
                                        <option value="">All Programs</option>
                                        {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="h-64">
                                    <Bar
                                        data={offenseChartData}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                                                x: { grid: { display: false } }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Top Offenders */}
                            <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6">Frequent Offenders</h3>
                                <div className="space-y-3">
                                    {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold text-xs">{name.charAt(0)}</div>
                                                <span className="font-medium text-xs">{name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{count} Incidents</span>
                                        </div>
                                    )) : <p className="text-center text-gray-400 py-12 text-xs italic">No high-frequency offenders found.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all cursor-pointer group" onClick={generateFullReport}>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl">📄</div>
                                    <div>
                                        <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">Export Case Summary</h3>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Generate a Word document of all disciplinary records.</p>
                                    </div>
                                </div>
                                <div className="mt-4 text-[10px] font-bold text-emerald-600 uppercase">DOCX Export</div>
                            </div>

                            <div className="p-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl">📈</div>
                                    <div>
                                        <h3 className="text-base font-bold">Trend Analysis</h3>
                                        <p className="text-xs text-gray-500 mt-1">Predictive behavioral modeling. (Coming Soon)</p>
                                    </div>
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
