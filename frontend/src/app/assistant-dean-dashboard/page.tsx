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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="All Cases" icon="⚖️" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
                <NavButton label="Manage Students" icon="🎓" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
              </nav>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Students" value={totalStudentsCount} color="indigo" />
                  <StatCard title="Total Cases" value={totalCasesCount} color="purple" />
                  <StatCard title="Pending" value={pendingCases} color="orange" />
                  <StatCard title="Resolved" value={resolvedCases} color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                    <h3 className="text-lg font-bold mb-6">Cases by Status</h3>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">Common Offences</h3>
                      <select
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-xs outline-none"
                        value={programFilter}
                        onChange={(e) => setProgramFilter(e.target.value)}
                      >
                        <option value="">All Programs</option>
                        {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <Bar data={offenseChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold mb-6">Most Common Offenders</h3>
                  <div className="space-y-4">
                    {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <span className="font-medium text-sm">{name}</span>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{count} Cases</span>
                      </div>
                    )) : <p className="text-center text-gray-500 py-8 italic text-sm">No offender data found.</p>}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold mb-4">Export Reports</h3>
                  <div className="flex gap-4">
                    <button onClick={exportCasesToWord} className="bg-kmuGreen text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition">Export All Cases (DOCX)</button>
                    <Link href="/reports" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition">Analytics Portal</Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6 text-sm">
                    <h2 className="text-xl font-bold">Pending Cases Review</h2>
                    <input
                      placeholder="Search cases..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 min-w-[250px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-bold text-gray-500">
                        <tr>
                          <th className="px-4 py-4 text-left">Student</th>
                          <th className="px-4 py-4 text-left">Offense</th>
                          <th className="px-4 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCases
                          .filter(c => c.status === 'Open' || c.status === 'Under Investigation')
                          .slice(0, 15)
                          .map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                              <td className="px-4 py-4">
                                <div className="font-bold">{c.student?.fullName}</div>
                                <div className="text-[10px] text-gray-400">{c.student?.studentId} • {c.student?.program}</div>
                              </td>
                              <td className="px-4 py-4">{c.offenseType}</td>
                              <td className="px-4 py-4 text-center">
                                <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-bold">{c.status}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-sm text-center py-20">
                  <h2 className="text-2xl font-bold mb-4">Student Management</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Access the full student registry to manage records, enrollments, and disciplinary histories.</p>
                  <Link href="/students" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition inline-block">Open Student Registry</Link>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
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

function StatCard({ title, value, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-600 border-indigo-100',
    purple: 'text-purple-600 border-purple-100',
    orange: 'text-orange-600 border-orange-100',
    green: 'text-green-600 border-green-100'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border ${colors[color]} p-5`}>
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">{title}</div>
      <div className={`text-3xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
    </div>
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