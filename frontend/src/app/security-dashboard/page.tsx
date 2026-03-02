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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Incident reporting and case management</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddCase(true)}
                className="bg-kmuGreen text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
              >
                🛡️ Create New Case
              </button>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Cases" value={cases.length} color="emerald" />
            <StatCard title="My Reports" value={cases.filter(c => c.createdBy === user?.id).length} color="blue" />
            <StatCard title="Open Cases" value={cases.filter(c => c.status === 'Open').length} color="orange" />
            <StatCard title="High Severity Cases" value={cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Analytics */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Incidents by Offense Type</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">All Programs</option>
                  {Array.from(new Set(students.map((s: any) => s.program).filter(Boolean))).map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64">
                <Bar
                  data={chartData}
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

            {/* AI Analysis */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">AI Case Summary</h3>
              <div className="space-y-4">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || cases.length === 0}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-50/10 transition group"
                >
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🧠</span>
                  <span className="text-xs font-bold text-gray-500">{isSummarizing ? "Processing..." : "Generate AI Summary"}</span>
                </button>
                {aiSummary && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/50 text-xs font-medium text-gray-700 dark:text-emerald-100 leading-relaxed">
                    {aiSummary}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Cases</h2>
              <div className="relative w-full md:w-80">
                <input
                  placeholder="Search cases..."
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-kmuGreen transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Offense Type</th>
                    <th className="px-6 py-4 text-center">Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 12).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-kmuGreen transition-colors uppercase">{c.student?.fullName || 'Anonymous Student'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{c.student?.studentId || 'UNKNOWN_ID'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-bold uppercase">{c.offenseType}</td>
                      <td className="px-6 py-4 text-center text-gray-400 text-xs font-mono">{new Date(c.incidentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${c.status === 'Open' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('docket'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:shadow-sm transition-all active:scale-95" title="Print Docket"
                          >🖨️</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('statement'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:shadow-sm transition-all active:scale-95" title="Print Statements"
                          >📜</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('callout'); setTimeout(() => window.print(), 500); }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:shadow-sm transition-all active:scale-95" title="Print Call Out"
                          >📢</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-20 text-gray-400 italic text-sm">No cases found matching your search.</div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
              <Link href="/cases" className="text-xs font-bold text-kmuGreen hover:text-green-700 uppercase tracking-wider transition-all">View All Cases →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add Case Modal */}
      {showAddCase && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddCase(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-t-4 border-kmuGreen p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Create New Case</h2>
                <p className="text-sm text-gray-500 mt-1">Enter incident details for the university record</p>
              </div>
              <button onClick={() => setShowAddCase(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-400 hover:text-red-500 transition-all">✕</button>
            </div>
            <CaseDossierForm
              onSuccess={() => {
                showNotification('success', 'Case created successfully');
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
    emerald: 'border-emerald-500 dark:border-emerald-400',
    blue: 'border-blue-500 dark:border-blue-400',
    orange: 'border-orange-500 dark:border-orange-400',
    red: 'border-red-500 dark:border-red-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color]}`}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}