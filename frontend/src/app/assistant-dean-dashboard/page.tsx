"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!authLoading && !token) {
        router.replace('/login');
        setIsCheckingAuth(false);
        return;
      }
      if (authLoading) {
        setIsCheckingAuth(true);
        return;
      }
      if (!user || user.role !== 'assistant_dean') {
        setIsCheckingAuth(false);
        return;
      }
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
      setError(null);
      try {
        const casesData = await fetchWithAuth(`${API_BASE_URL}/cases`);
        setCases(Array.isArray(casesData) ? casesData : (casesData.cases || casesData || []));

        const studentsData = await fetchWithAuth(`${API_BASE_URL}/students`);
        setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData || []));
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
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

  const safeStudents = Array.isArray(students) ? students : [];
  const safeCases = Array.isArray(cases) ? cases : [];

  useEffect(() => {
    let casesResult = safeCases;
    if (search) {
      casesResult = casesResult.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (programFilter) {
      casesResult = casesResult.filter((c: any) => c.student?.program === programFilter);
    }
    setFilteredCases(casesResult);

    let studentsResult = safeStudents;
    if (search) {
      studentsResult = studentsResult.filter((s: any) =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredStudents(studentsResult);
  }, [search, cases, students, programFilter]);

  async function exportCasesToWord() {
    try {
      const chartExportData = await prepareChartExport();
      const res = await fetch(`${API_BASE_URL}/reports/dashboard-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          charts: chartExportData.charts,
          pageInfo: {
            title: 'Assistant Dean Dashboard - All Cases Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'assistant_dean_all_cases_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export cases error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'assistant_dean') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const staffData = profile || user;

  // Visualization data
  const totalCasesCount = filteredCases.length;
  const totalStudentsCount = safeStudents.length;
  const pendingCases = filteredCases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length;
  const resolvedCases = filteredCases.filter(c => c.status === 'Closed').length;

  const analyticsCases = programFilter
    ? safeCases.filter((c: any) => c.student?.program === programFilter)
    : safeCases;

  const statusCounts: Record<string, number> = {};
  const offenseCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};

  analyticsCases.forEach((c: Case) => {
    if (c.status) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Cases by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(168, 85, 247, 0.7)',
        ],
      },
    ],
  };

  const topOffences = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));

  const offenseChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [
      {
        label: 'Most Common Offences',
        data: topOffences.map(([, count]) => count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Overview</h1>
              <p className="text-xs text-blue-600 font-semibold mt-1 uppercase tracking-wider">Assistant Dean Dashboard</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm"
              >
                Export Registry
              </button>
              <Link
                href="/assistant-dean-dashboard/reports"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 transition shadow-sm"
              >
                Reports
              </Link>
            </div>
          </div>

          {/* Quick Navigation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/assistant-dean-dashboard/cases" className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/30 transition-all group shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold group-hover:text-blue-600 transition-colors">Cases</h3>
                <p className="text-[10px] text-gray-500 font-medium">Review and update records</p>
              </div>
              <span className="text-lg group-hover:translate-x-1 transition-transform">➡️</span>
            </Link>
            <Link href="/assistant-dean-dashboard/students" className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-kmuGreen/30 transition-all group shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold group-hover:text-kmuGreen transition-colors">Students</h3>
                <p className="text-[10px] text-gray-500 font-medium">Academic status & profiles</p>
              </div>
              <span className="text-lg group-hover:translate-x-1 transition-transform">➡️</span>
            </Link>
          </div>

          {/* System Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Students" value={totalStudentsCount} color="indigo" />
            <StatCard title="Total Cases" value={totalCasesCount} color="purple" />
            <StatCard title="Open" value={pendingCases} color="orange" />
            <StatCard title="Resolved" value={resolvedCases} color="green" />
          </div>

          {/* Case Registry Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
              <h2 className="text-base font-bold">Recent Cases</h2>
              <Link href="/assistant-dean-dashboard/cases" className="text-xs font-bold text-blue-600 hover:underline">Full Registry →</Link>
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
                  {filteredCases.slice(0, 8).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-500">{c.student?.studentId}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{c.offenseType}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">No records found.</div>
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

function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-600'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function InfoField({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}