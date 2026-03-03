"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function DeanOfStudentsDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
      if (!user || user.role !== 'dean_of_students') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [programFilter, setProgramFilter] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

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
        } else {
          setCases([]);
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || studentsData || []);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setCases([]);
        setStudents([]);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
    }
  }, [token]);

  const handleGenerateSummary = async () => {
    if (cases.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const descriptions = cases.slice(0, 30).map(c => c.description).filter(d => !!d);
      const res = await fetch('/api/ai-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptions })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        showNotification('error', 'Failed to generate AI summary');
      }
    } catch (err) {
      console.error('Summary error:', err);
      showNotification('error', 'An error occurred during AI analysis');
    } finally {
      setIsSummarizing(false);
    }
  };

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
          pageInfo: { title: 'Dean of Students Dashboard Report', url: window.location.href }
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'dean_of_students_report.docx');
      showNotification('success', 'Dossier exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth || (profileLoading && !profile)) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'dean_of_students') {
    return <div className="text-red-600 p-12 text-center">Access denied.</div>;
  }

  // Analytics
  const analyticsCases = programFilter ? safeCases.filter((c: any) => c.student?.program === programFilter) : safeCases;
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
      borderRadius: 12,
    }],
  };

  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Dean of Students Dashboard</h1>
              <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">Dean's Disciplinary Overview</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || cases.length === 0}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50 uppercase tracking-widest"
              >
                {isSummarizing ? "Analyzing..." : "✨ AI Behavioral Insight"}
              </button>
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition uppercase tracking-widest"
              >
                Export Case Records
              </button>
            </div>
          </div>

          {/* Quick Navigation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dean-of-students-dashboard/cases" className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-red-500/50 transition-all group shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-red-600 transition-colors">Disciplinary Records</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Review university-wide disciplinary records</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">⚖️</span>
              </div>
            </Link>
            <Link href="/dean-of-students-dashboard/students" className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all group shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Student Registry</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Explore complete student profiles and history</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">👤</span>
              </div>
            </Link>
            <Link href="/dean-of-students-dashboard/reports" className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 transition-all group shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-blue-600 transition-colors">reports & Data</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Access advanced analytics and export tools</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">📊</span>
              </div>
            </Link>
          </div>

          {/* System Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={safeStudents.length} color="teal" />
            <StatCard title="Total Cases" value={safeCases.length} color="orange" />
            <StatCard title="Pending Review" value={safeCases.filter(c => c.status === 'Open').length} color="blue" />
            <StatCard title="High Risk" value={safeCases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
          </div>

          {/* AI behavioral Insight Panel */}
          {aiSummary && (
            <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden group animate-in slide-in-from-top-4 duration-500 shadow-xl">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Strategic behavioral Analysis</span>
                  <button onClick={() => setAiSummary(null)} className="text-gray-400 hover:text-gray-600 transition font-bold">DISMISS</button>
                </div>
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed text-sm font-bold italic font-sans">
                  "{aiSummary}"
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Analysis */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Offense Type Distribution</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
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

            {/* Top Offenders List snippet */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Frequent Offenders</h3>
              <div className="space-y-4">
                {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 font-bold text-sm uppercase">{name.charAt(0)}</div>
                      <span className="font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-tight">{name}</span>
                    </div>
                    <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full uppercase tracking-tighter">{count} Incidents</span>
                  </div>
                )) : <p className="text-center text-gray-400 py-16 italic text-xs uppercase tracking-widest font-black">No high-frequency offenders found.</p>}
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
    teal: 'border-emerald-500 dark:border-emerald-400',
    orange: 'border-orange-500 dark:border-orange-400',
    blue: 'border-blue-500 dark:border-blue-400',
    red: 'border-red-500 dark:border-red-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color]}`}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}