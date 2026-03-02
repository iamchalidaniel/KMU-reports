"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, OFFENSE_TYPES, SEVERITY_LEVELS } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartStudentSearch from '../../components/SmartStudentSearch';
import Notification, { useNotification } from '../../components/Notification';
import CaseDossierForm from '../../components/CaseDossierForm';
import CaseDossierPrintable from '../../components/CaseDossierPrintable';

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
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Case submission handled by CaseDossierForm

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'security_officer') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const staffData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Nav */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Overview" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="Record Case" icon="✍️" active={activeTab === 'add-case'} onClick={() => setActiveTab('add-case')} />
                <NavButton label="Case History" icon="📜" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              </nav>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'add-case' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">New Disciplinary Dossier</h2>
                    <p className="text-gray-500 text-sm mt-1 uppercase tracking-tight">Security Department Official Protocol</p>
                  </div>
                  <button onClick={() => setActiveTab('dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">✕</button>
                </div>

                <CaseDossierForm
                  onSuccess={async () => {
                    showNotification('success', 'Case dossier registered successfully!');
                    // Refresh list
                    const casesRes = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
                    if (casesRes.ok) {
                      const data = await casesRes.json();
                      setCases(Array.isArray(data) ? data : (data.cases || data || []));
                    }
                    setActiveTab('dashboard');
                  }}
                  onCancel={() => setActiveTab('dashboard')}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold">Recent Incident Registry</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight font-bold">Total Records: {filteredCases.length}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isSummarizing || cases.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold text-xs hover:shadow-sm transition disabled:opacity-50"
                    >
                      <span>{isSummarizing ? "⏳ Analyzing..." : "✨ AI Trend Insights"}</span>
                    </button>
                    <input
                      placeholder="Filter records..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {aiSummary && (
                  <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">AI Behavioral Analysis</span>
                      </div>
                      <button onClick={() => setAiSummary(null)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {aiSummary}
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800 text-[10px] text-emerald-600/60 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This summary is generated based on anonymized descriptions from current visible cases.
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-4 text-left">Subject</th>
                        <th className="px-4 py-4 text-left">Incident</th>
                        <th className="px-4 py-4 text-center">Date</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-4 py-4 text-right">Print</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredCases.slice(0, 15).map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 group">
                          <td className="px-4 py-4" onClick={() => router.push(`/cases/${c._id}`)}>
                            <div className="font-bold">{c.student?.fullName || 'Unknown Object'}</div>
                            <div className="text-[10px] text-gray-400">{c.student?.studentId || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4">{c.offenseType}</td>
                          <td className="px-4 py-4 text-center font-mono text-gray-500">{new Date(c.incidentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${c.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('docket'); setTimeout(() => window.print(), 500); }}
                                className="p-1 hover:text-blue-600 font-bold" title="Print Docket"
                              >🖨️</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('statement'); setTimeout(() => window.print(), 500); }}
                                className="p-1 hover:text-blue-600 font-bold" title="Print Statements"
                              >📜</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrintCase(c); setPrintType('callout'); setTimeout(() => window.print(), 500); }}
                                className="p-1 hover:text-blue-600 font-bold" title="Print Call Out"
                              >📢</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                {/* Analytics restoration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Cases" value={cases.length} color="blue" />
                  <StatCard title="My Reports" value={cases.filter(c => c.createdBy === user?.id).length} color="indigo" />
                  <StatCard title="Pending" value={cases.filter(c => c.status === 'Open').length} color="orange" />
                  <StatCard title="Priority" value={cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="red" />
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Campus Security Trends</h3>
                    <select
                      className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-xs outline-none"
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                    >
                      <option value="">All Programs</option>
                      {Array.from(new Set(students.map((s: any) => s.program).filter(Boolean))).map((p: any) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">View real-time security analytics and incident distributions.</p>
                  <Link href="/reports" className="text-blue-600 font-bold text-sm hover:underline">Open Detailed Security Analytics Portal →</Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

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
    blue: 'text-blue-600 border-blue-100',
    indigo: 'text-indigo-600 border-indigo-100',
    orange: 'text-orange-600 border-orange-100',
    red: 'text-red-600 border-red-100'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border ${colors[color]} p-5`}>
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">{title}</div>
      <div className={`text-3xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
    </div>
  );
}

function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
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
      <label className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}