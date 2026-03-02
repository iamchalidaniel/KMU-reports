"use client";

import { useState, useEffect } from 'react';
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
import Notification, { useNotification } from '../../components/Notification';
import CaseDossierForm from '../../components/CaseDossierForm';
import CaseDossierPrintable from '../../components/CaseDossierPrintable';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Student {
  studentId: string;
  fullName: string;
  program: string;
  year?: string;
  gender?: string;
}

export default function SecurityDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAddCase, setShowAddCase] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [printCase, setPrintCase] = useState<any>(null);
  const [printType, setPrintType] = useState<'docket' | 'statement' | 'callout' | 'warnAndCaution'>('docket');

  // List state
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

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
      if (!user || user.role !== 'security_officer') {
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

    async function fetchCases() {
      try {
        const [casesRes, studentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } })
        ]);
        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(Array.isArray(data) ? data : (data.cases || data || []));
        }
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(Array.isArray(data) ? data : (data.students || data || []));
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchCases();
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

  useEffect(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    let result = safeCases;
    if (search) {
      result = result.filter((c: any) =>
      (c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (programFilter) {
      result = result.filter((c: any) => c.student?.program === programFilter);
    }
    setFilteredCases(result);
  }, [search, cases, programFilter]);

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'security_officer') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const offenceCounts: Record<string, number> = {};
  cases.forEach((c: any) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
  });
  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const chartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Incident Frequency',
      data: topOffences.map(([, count]) => count),
      backgroundColor: 'rgba(5, 150, 105, 0.7)',
      borderRadius: 12,
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-emerald-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Security Operations</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Direct Enforcement & Disciplinary Governance</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddCase(true)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center gap-2 group border-none"
              >
                <span className="group-hover:animate-bounce">🛡️</span> Record Executive Dossier
              </button>
            </div>
          </div>

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Index" value={cases.length} color="emerald" />
            <StatCard title="Officer Reports" value={cases.filter(c => c.createdBy === user?.id).length} color="blue" />
            <StatCard title="Active Protocols" value={cases.filter(c => c.status === 'Open').length} color="orange" />
            <StatCard title="Critical Anomalies" value={cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Incident Intelligence */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Campus Incident Velocity</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {Array.from(new Set(students.map((s: any) => s.program).filter(Boolean))).map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </div>

            {/* AI Insight Terminal */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Intelligence Synthesis</h3>
              <div className="space-y-6">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || cases.length === 0}
                  className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl hover:border-emerald-500/50 hover:bg-emerald-50/10 transition group"
                >
                  <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🧠</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isSummarizing ? "Processing Data..." : "Run AI Pattern Analysis"}</span>
                </button>
                {aiSummary && (
                  <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-xs font-medium text-gray-700 dark:text-emerald-100 leading-relaxed font-sans">
                    {aiSummary}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operational Dispatch Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Operational Dispatch Ledger</h2>
              <div className="relative w-full md:w-80 font-sans">
                <input
                  placeholder="Query ledger indices..."
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3.5 text-xs w-full focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto flex-1 font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left">Entity / Identification</th>
                    <th className="px-8 py-5 text-left">Incident Class</th>
                    <th className="px-8 py-5 text-center">Protocol Date</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 12).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase">{c.student?.fullName || 'Anonymous Entity'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.student?.studentId || 'UNKNOWN_ID'}</div>
                      </td>
                      <td className="px-8 py-5 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-tight">{c.offenseType}</td>
                      <td className="px-8 py-5 text-center font-mono text-gray-400 text-[10px]">{new Date(c.incidentDate).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter border ${c.status === 'Open' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>{c.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('docket'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 rounded-xl hover:shadow-lg transition-all transform active:scale-95" title="Print Docket"
                          >🖨️</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('statement'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 rounded-xl hover:shadow-lg transition-all transform active:scale-95" title="Print Statements"
                          >📜</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('callout'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 rounded-xl hover:shadow-lg transition-all transform active:scale-95" title="Print Call Out"
                          >📢</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-24 text-gray-400 italic text-sm font-serif">Registry query returned zero indices.</div>
              )}
            </div>
            <div className="p-6 bg-gray-50/30 dark:bg-gray-800/20 text-center border-t border-gray-100 dark:border-gray-800">
              <Link href="/cases" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-[0.2em] transition-all">Expand Historical Dossier →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add Case Modal */}
      {showAddCase && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => setShowAddCase(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border-t-8 border-emerald-600 p-12">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">New Disciplinary Dossier</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Official Protocol Registration</p>
              </div>
              <button onClick={() => setShowAddCase(false)} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full text-gray-400 hover:text-emerald-600 transition-all">✕</button>
            </div>
            <CaseDossierForm
              onSuccess={() => {
                showNotification('success', 'Protocol successfully indexed');
                setShowAddCase(false);
                fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } })
                  .then(res => res.json())
                  .then(data => setCases(Array.isArray(data) ? data : (data.cases || data || [])));
              }}
              onCancel={() => setShowAddCase(false)}
            />
          </div>
        </div>
      )}

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}

      {/* Hidden Printable Area */}
      {printCase && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <CaseDossierPrintable data={printCase} documentType={printType} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50',
    red: 'text-red-700 bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight italic">{value}</div>
    </div>
  );
}