"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

export default function SecretaryDashboard() {
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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

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
      if (!user || user.role !== 'secretary') {
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
        const casesRes = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
        const studentsRes = await fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } });
        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(data.cases || data || []);
        }
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.students || data || []);
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

  const handleGenerateSummary = async () => {
    if (cases.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const descriptions = cases.slice(0, 20).map(c => c.description).filter(d => !!d);
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
    setFilteredCases(
      search ? safeCases.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      ) : safeCases
    );
    setFilteredStudents(
      search ? safeStudents.filter((s: any) =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase())
      ) : safeStudents
    );
  }, [search, cases, students]);

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
            title: 'Secretary Dashboard Administrative Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'secretary_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export report');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'secretary') return <div className="text-red-600 p-12">Access denied.</div>;

  const staffData = profile || user;

  // Stats
  const todayCount = filteredCases.filter(c => new Date(c.createdAt || 0).toDateString() === new Date().toDateString()).length;
  const recentCount = filteredCases.filter(c => {
    const d = new Date(c.createdAt || 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  // Charts
  const last7Days = [];
  const casesPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    casesPerDay.push(filteredCases.filter(c => new Date(c.createdAt || 0).toDateString() === d.toDateString()).length);
  }

  const trendData = {
    labels: last7Days,
    datasets: [{
      label: 'Cases',
      data: casesPerDay,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const deptCounts: Record<string, number> = {};
  filteredCases.forEach(c => {
    const d = c.student?.department || 'N/A';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  const deptData = {
    labels: Object.keys(deptCounts),
    datasets: [{
      label: 'By Department',
      data: Object.values(deptCounts),
      backgroundColor: '#F59E0B'
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Banner */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'Secretary Name'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Staff ID : <span className="text-emerald-600 dark:text-emerald-400 font-mono">{staffData.staffId || staffData.username}</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Nav */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Dashboard" icon="🏢" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="Registry" icon="📋" active={activeTab === 'registry'} onClick={() => setActiveTab('registry')} />
                <NavButton label="Staff Info" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Settings" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Administrative Intelligence</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generative Behavioral summaries</p>
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing || cases.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-kmuGreen hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    {isSummarizing ? "⏳ ANALYZING..." : "✨ AI SUMMARY"}
                  </button>
                </div>

                {aiSummary && (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-widest">
                        <span className="text-xl">✨</span> AI Trends Insight
                      </div>
                      <button onClick={() => setAiSummary(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {aiSummary}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Students" value={safeStudents.length} color="teal" />
                  <StatCard title="Total Cases" value={filteredCases.length} color="emerald" />
                  <StatCard title="Added Today" value={todayCount} color="blue" />
                  <StatCard title="This Week" value={recentCount} color="orange" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-bold opacity-50 mb-4 uppercase tracking-widest">Weekly Activity</h3>
                    <Line data={trendData} />
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-bold opacity-50 mb-4 uppercase tracking-widest">Prog. Distribution</h3>
                    <Bar data={deptData} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="font-bold mb-4">Documentation Actions</h3>
                  <div className="flex gap-4">
                    <button onClick={exportCasesToWord} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">EXPORT CASES (DOCX)</button>
                    <Link href="/reports" className="px-6 py-2 border border-emerald-600 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition">VIEW FULL REPORTS</Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'registry' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Administrative Registry</h2>
                    <input
                      placeholder="Search student or case..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-400 uppercase">
                        <tr>
                          <th className="px-4 py-4 text-left">Entity</th>
                          <th className="px-4 py-4 text-left">Details</th>
                          <th className="px-4 py-4 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCases.slice(0, 15).map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                            <td className="px-4 py-4">
                              <div className="font-bold text-emerald-600">{c.student?.fullName}</div>
                              <div className="text-[10px] text-gray-400">{c.student?.studentId}</div>
                            </td>
                            <td className="px-4 py-4">{c.offenseType}</td>
                            <td className="px-4 py-4 text-center text-gray-500 font-mono">{new Date(c.createdAt || 0).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
                <div className="space-y-10">
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Account Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Staff ID" value={staffData.staffId || staffData.username} />
                      <InfoField label="Role" value={staffData.role?.toUpperCase().replace('_', ' ')} />
                      <InfoField label="Status" value="ACTIVE" />
                    </div>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Personal Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="First Name" value={staffData.firstName} />
                      <InfoField label="Sur Name" value={staffData.surName} />
                      <InfoField label="NRC" value={staffData.nrc} />
                      <InfoField label="Gender" value={staffData.gender} />
                      <InfoField label="Nationality" value={staffData.nationality} />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 animate-in fade-in duration-300 max-w-md mx-auto text-center">
                <h2 className="text-2xl font-bold text-emerald-600 mb-8 uppercase tracking-widest">Administrative Password</h2>
                <p className="text-gray-500 text-sm mb-8">Update your system access credentials here.</p>
                <button onClick={() => showNotification('info', 'Feature coming soon')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg uppercase text-xs tracking-widest">Initialize Reset</button>
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
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'
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
    teal: 'text-teal-600 border-teal-100',
    emerald: 'text-emerald-600 border-emerald-100',
    blue: 'text-blue-600 border-blue-100',
    orange: 'text-orange-600 border-orange-100'
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
      <label className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}