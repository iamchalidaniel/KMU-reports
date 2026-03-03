"use client";

import { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChiefSecurityOfficerDashboard() {
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
      if (!user || user.role !== 'chief_security_officer') {
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
      try {
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
  }, [search, cases, programFilter]);

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
          pageInfo: { title: 'CSO High-Level Report', url: typeof window !== 'undefined' ? window.location.href : '' }
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'cso_strategic_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'chief_security_officer') {
    return <div className="text-red-600 p-12 text-center">Access denied.</div>;
  }

  // Visualization data
  const offenceCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};
  (programFilter ? safeCases.filter((c: any) => c.student?.program === programFilter) : safeCases).forEach((c: Case) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });
  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));

  const offenceChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Frequency',
      data: topOffences.map(([, count]) => count),
      backgroundColor: 'rgba(220, 38, 38, 0.7)',
      borderRadius: 12,
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Security Command</h1>
              <p className="text-xs text-red-600 font-semibold mt-1 uppercase tracking-wider">CSO Strategy & Oversight</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm"
              >
                Export Strategy Report
              </button>
              <Link
                href="/chief-security-officer-dashboard/reports"
                className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-red-700 transition shadow-sm"
              >
                Security Analytics
              </Link>
            </div>
          </div>

          {/* Security Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="All Cases" value={safeCases.length} color="red" />
            <StatCard title="Open" value={safeCases.filter(c => c.status === 'Open').length} color="blue" />
            <StatCard title="Priority" value={safeCases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="orange" />
            <StatCard title="Students" value={safeStudents.length} color="indigo" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Recent Cases */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Incidents</h2>
                <div className="relative w-full md:w-64">
                  <input
                    placeholder="Quick search..."
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs w-full focus:ring-2 focus:ring-red-500 transition-all font-sans"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Student</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCases.slice(0, 10).map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                          <div className="text-[10px] text-gray-500">{c.student?.studentId || 'EXTERNAL'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{c.offenseType}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[10px] font-bold ${c.severity === 'Critical' ? 'text-red-600 underline' : 'text-gray-400'}`}>
                            {c.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCases.length === 0 && (
                  <div className="text-center py-12 text-gray-400 italic">No incidents recorded.</div>
                )}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
                <Link href="/cases" className="text-[10px] font-bold text-red-600 hover:underline uppercase tracking-wider transition-all">Full Case Ledger →</Link>
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

function StatCard({ title, value, color }: any) {
  const colors: any = {
    red: 'border-red-500 dark:border-red-400',
    blue: 'border-blue-500 dark:border-blue-400',
    orange: 'border-orange-500 dark:border-orange-400',
    indigo: 'border-indigo-500 dark:border-indigo-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all hover:scale-[1.01] ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}