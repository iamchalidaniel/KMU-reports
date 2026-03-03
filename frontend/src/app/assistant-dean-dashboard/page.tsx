"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Chart as ChartJS } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { fetchWithAuth, authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AssistantDeanDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!token || user?.role !== 'assistant_dean')) {
      router.replace('/login');
    } else if (!authLoading) {
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    async function fetchStaffProfile() {
      try {
        setProfileLoading(true);
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setProfileLoading(false);
      }
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [casesData, studentsData] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/cases`),
          fetchWithAuth(`${API_BASE_URL}/students`)
        ]);
        setCases(Array.isArray(casesData) ? casesData : (casesData.cases || []));
        setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.students || []));
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setCases([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
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
    setFilteredCases(result);
  }, [search, cases]);

  const handleGenerateSummary = async () => {
    try {
      setIsSummarizing(true);
      const res = await fetch(`${API_BASE_URL}/ai-summarize/dashboard`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant_dean' }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('success', data.summary || 'Summary generated');
      } else {
        throw new Error('Summary failed');
      }
    } catch (err) {
      showNotification('error', 'AI analysis unavailable');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isCheckingAuth || authLoading) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Dean's Suite</h1>
              <p className="text-xs text-kmuGreen font-semibold mt-1 uppercase tracking-wider">Academic Oversight</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || cases.length === 0}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                {isSummarizing ? "Analyzing..." : "✨ AI Insight"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Administrative Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/assistant-dean-dashboard/cases" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">⚖️</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-kmuGreen transition-colors">Case Registry</div>
                    <div className="text-[10px] text-gray-500">Student disciplinary list</div>
                  </div>
                </Link>
                <Link href="/assistant-dean-dashboard/reports" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">📈</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Analytics</div>
                    <div className="text-[10px] text-gray-500">Departmental metrics</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Admin Status Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Department</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-xl font-black text-gray-900 dark:text-white tracking-widest uppercase">{profile?.department || 'OFFICE OF THE DEAN'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Access Level</div>
                <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">ADMIN-LEVEL-2</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={students.length} color="indigo" />
            <StatCard title="Active Cases" value={cases.filter(c => c.status === 'Open').length} color="purple" />
            <StatCard title="Pending Review" value={cases.filter(c => c.status === 'Under Investigation').length} color="orange" />
            <StatCard title="Resolved" value={cases.filter(c => c.status === 'Closed').length} color="green" />
          </div>

          {/* Case Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Case Activity</h2>
              <Link href="/assistant-dean-dashboard/cases" className="text-xs font-bold text-kmuGreen hover:underline">Full Audit →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Offense</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 5).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-500">{c.student?.studentId}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{c.offenseType}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function StatCard({ title, value, color }: any) {
  const colors: any = {
    indigo: 'border-indigo-500 dark:border-indigo-400',
    purple: 'border-purple-500 dark:border-purple-400',
    orange: 'border-orange-500 dark:border-orange-400',
    green: 'border-green-500 dark:border-green-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all hover:scale-[1.01] ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}