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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Header Area */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Security Command</h1>
              <p className="text-xs text-kmuGreen font-semibold mt-1 uppercase tracking-wider">Officer Field Operations</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/security-dashboard/reports"
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm"
              >
                Incident Analytics
              </Link>
              <button
                onClick={() => setShowAddCase(true)}
                className="bg-kmuGreen text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition shadow-sm flex items-center gap-2"
              >
                Log Incident
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total" value={cases.length} color="teal" />
            <StatCard title="My Logs" value={cases.filter(c => c.createdBy === user?.id).length} color="blue" />
            <StatCard title="Open" value={cases.filter(c => c.status === 'Open').length} color="orange" />
            <StatCard title="Critical" value={cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Ledger */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Active Logs</h2>
                <div className="relative w-full md:w-64">
                  <input
                    placeholder="Search incidents..."
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs w-full focus:ring-2 focus:ring-kmuGreen transition-all"
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
                      <th className="px-6 py-4 text-left">Incident</th>
                      <th className="px-6 py-4 text-center">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCases.slice(0, 10).map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                          <div className="text-[10px] text-gray-500">{c.student?.studentId}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium uppercase">{c.offenseType}</td>
                        <td className="px-6 py-4 text-center text-gray-400 font-mono text-[10px]">
                          {new Date(c.incidentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('docket'); setTimeout(() => window.print(), 500); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 transition">🖨️</button>
                            <button onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('statement'); setTimeout(() => window.print(), 500); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 transition">📜</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Summary Sidebar */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">AI Behavioral Insight</h3>
              <div className="space-y-4 flex-1">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || cases.length === 0}
                  className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-kmuGreen hover:bg-emerald-50/10 transition group"
                >
                  <span className="text-xl mb-2 group-hover:scale-110 transition-transform">✨</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{isSummarizing ? "Analyzing..." : "Analyze Cases"}</span>
                </button>
                {aiSummary && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100/50 text-[11px] font-medium text-gray-700 dark:text-emerald-100 leading-relaxed max-h-64 overflow-y-auto">
                    {aiSummary}
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link href="/cases" className="text-[10px] font-bold text-kmuGreen uppercase tracking-widest hover:underline">Full Command Registry →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Case Modal */}
      {showAddCase && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddCase(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Incident</h2>
                <p className="text-xs text-gray-500 mt-1">Submit case details for review</p>
              </div>
              <button onClick={() => setShowAddCase(false)} className="text-gray-400 hover:text-red-500 transition-all font-bold">✕</button>
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
    teal: 'border-teal-500 dark:border-teal-400',
    emerald: 'border-emerald-500 dark:border-emerald-400',
    blue: 'border-blue-500 dark:border-blue-400',
    orange: 'border-orange-500 dark:border-orange-400',
    red: 'border-red-500 dark:border-red-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all hover:scale-[1.01] ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}