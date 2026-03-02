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
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-emerald-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Dean's Executive Suite</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Student Affairs & Behavioral Management Oversight</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || cases.length === 0}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center gap-2 group border-none"
              >
                <span className="group-hover:animate-pulse">✨</span> {isSummarizing ? "Synthesizing..." : "Run AI Behavioral Audit"}
              </button>
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition"
              >
                Export Strategic Dossier
              </button>
            </div>
          </div>

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="University Population" value={safeStudents.length} color="teal" />
            <StatCard title="Total Infractions" value={safeCases.length} color="orange" />
            <StatCard title="Active Inquiries" value={safeCases.filter(c => c.status === 'Open').length} color="blue" />
            <StatCard title="Critical Priority" value={safeCases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
          </div>

          {/* AI behavioral Insight Panel */}
          {aiSummary && (
            <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden group animate-in slide-in-from-top-4 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl font-black">AI</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Administrative Intelligence Synthesis</span>
                  <button onClick={() => setAiSummary(null)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
                </div>
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm font-medium italic font-sans">
                  "{aiSummary}"
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Infraction Distribution */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Campus-Wide Behavioral Analytics</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">Full University</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={offenseChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </div>

            {/* Recidivism Watchlist */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Priority Observation Watch</h3>
              <div className="space-y-4 font-sans">
                {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-2xl transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase">{name.charAt(0)}</div>
                      <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{name}</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg uppercase tracking-tighter">{count} INCIDENTS</span>
                  </div>
                )) : <p className="text-center text-gray-400 py-12 italic text-xs">No watch data.</p>}
              </div>
            </div>
          </div>

          {/* Strategic Record Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-black uppercase tracking-tighter italic text-emerald-600">Strategic Disciplinary Ledger</h2>
              <div className="relative w-full md:w-80 font-sans">
                <input
                  placeholder="Query behavioral indices..."
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3.5 text-xs w-full focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left">Entity / Identification</th>
                    <th className="px-8 py-5 text-left">Incident Classification</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Escalation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 12).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase">{c.student?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-400 font-mono italic">{c.student?.studentId || 'EXTERNAL'}</div>
                      </td>
                      <td className="px-8 py-5 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-tight">{c.offenseType}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border ${c.status === 'Open' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>{c.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-[10px] font-black uppercase ${c.severity === 'Critical' ? 'text-red-600 animate-pulse' :
                          c.severity === 'High' ? 'text-red-500' : 'text-gray-400'
                          }`}>
                          {c.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-24 text-gray-400 italic text-sm font-serif">Empty behavioral registry.</div>
              )}
            </div>
            <div className="p-8 bg-gray-50/30 dark:bg-gray-800/20 text-center border-t border-gray-100 dark:border-gray-800">
              <Link href="/cases" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-[0.3em] transition-all">Expand Campus Dossier →</Link>
            </div>
          </div>

          {/* Registry Shortcut */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Dean's Registry Shortcut</h2>
              <Link href="/students" className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-widest">Global Registry →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 font-sans">
              {filteredStudents.slice(0, 12).map((s, i) => (
                <div key={i} className="flex flex-col items-center bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-3xl hover:shadow-lg transition cursor-pointer text-center group border border-transparent hover:border-emerald-500/10" onClick={() => router.push(`/students/${s._id}`)}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 font-bold mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform text-lg">{s.fullName?.charAt(0)}</div>
                  <div className="font-extrabold text-[11px] line-clamp-1 dark:text-gray-100 uppercase tracking-tight">{s.fullName}</div>
                  <div className="text-[9px] text-gray-400 font-bold tracking-tighter mt-1 uppercase">{s.studentId}</div>
                </div>
              ))}
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
    teal: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    red: 'text-red-700 bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight italic">{value}</div>
    </div>
  );
}