"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, OFFENSE_TYPES, SEVERITY_LEVELS } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartStudentSearch from '../../components/SmartStudentSearch';
import SmartStaffSearch from '../../components/SmartStaffSearch';
import Notification, { useNotification } from '../../components/Notification';

interface Student {
  studentId: string;
  fullName: string;
  program: string;
  year?: string;
  gender?: string;
}

interface Staff {
  staffId: string;
  fullName: string;
  department: string;
  position?: string;
}

export default function SecurityDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [caseType, setCaseType] = useState<'student' | 'staff'>('student');
  const [studentId, setStudentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [offenseType, setOffenseType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [sanctions, setSanctions] = useState('');
  const [loading, setLoading] = useState(false);

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

  const [isReviewing, setIsReviewing] = useState(false);
  const [isGettingSanction, setIsGettingSanction] = useState(false);

  const handleReviewDescription = async () => {
    if (!description.trim() || isReviewing) return;
    setIsReviewing(true);
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Review this incident description for clarity and detail. Offense Category: ${offenseType}, Severity: ${severity}.\n\nDescription: ${description}` }],
          formType: 'case'
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('info', data.response);
      }
    } catch (err) {
      showNotification('error', 'AI Review failed');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGetSanctionSuggestion = async () => {
    if (!offenseType || !severity || isGettingSanction) return;
    setIsGettingSanction(true);
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Based on university policy, what are the standard sanctions for: Offense: ${offenseType}, Severity: ${severity}?` }],
          formType: 'appeal' // Using appeal's prompt logic for policy guidance
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSanctions(data.response);
        showNotification('success', 'AI suggested a sanction based on policy');
      }
    } catch (err) {
      showNotification('error', 'Failed to get sanction guidance');
    } finally {
      setIsGettingSanction(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const requestBody: any = {
        incident_date: incidentDate,
        offense_type: offenseType,
        severity,
        description,
        sanctions
      };

      if (caseType === 'student') {
        if (!studentId) throw new Error('Please select a student');
        requestBody.student_id = studentId;
      } else {
        if (!staffId) throw new Error('Please select a staff member');
        requestBody.staff_id = staffId;
      }

      const res = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(await res.text());

      showNotification('success', 'Case submitted successfully!');
      // Reset form
      setStudentId('');
      setStaffId('');
      setIncidentDate('');
      setOffenseType('');
      setSeverity('');
      setDescription('');
      setSanctions('');
      setSelectedStudent(null);
      setSelectedStaff(null);

      // Refresh list
      const casesRes = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(Array.isArray(data) ? data : (data.cases || data || []));
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  }

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
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold mb-8 uppercase tracking-tighter">Register Disciplinary Case</h2>

                <div className="mb-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl inline-flex gap-2">
                  <button
                    onClick={() => setCaseType('student')}
                    className={`px-6 py-2 rounded-lg font-bold text-xs transition ${caseType === 'student' ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-400'}`}
                  >STUDENT</button>
                  <button
                    onClick={() => setCaseType('staff')}
                    className={`px-6 py-2 rounded-lg font-bold text-xs transition ${caseType === 'staff' ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-400'}`}
                  >STAFF MEMBER</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Search Subject</label>
                    {caseType === 'student' ? (
                      <SmartStudentSearch
                        onStudentSelect={(s) => { setSelectedStudent(s as any); setStudentId((s as any).studentId); }}
                        placeholder="Search student by name or ID..."
                      />
                    ) : (
                      <SmartStaffSearch
                        onStaffSelect={(s) => { setSelectedStaff(s); setStaffId(s.staffId); }}
                        placeholder="Search staff by name or ID..."
                      />
                    )}
                    {(selectedStudent || selectedStaff) && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl animate-in zoom-in duration-200">
                        <div className="font-bold text-blue-700 dark:text-blue-300">{(selectedStudent || selectedStaff)?.fullName}</div>
                        <div className="text-[10px] uppercase text-blue-500 font-bold">
                          {selectedStudent ? `${selectedStudent.studentId} • ${selectedStudent.program}` : `${(selectedStaff as any)?.staffId} • ${(selectedStaff as any)?.department}`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Incident Date</label>
                      <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Offense Type</label>
                      <select value={offenseType} onChange={(e) => setOffenseType(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3">
                        <option value="">Select Category...</option>
                        {OFFENSE_TYPES.map(ot => <option key={ot.value} value={ot.value}>{ot.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Severity Level</label>
                      <select value={severity} onChange={(e) => setSeverity(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3">
                        <option value="">Select Severity...</option>
                        {SEVERITY_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Incident Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the circumstances of the incident..."
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Immediate Actions / Sanctions</label>
                    <input
                      type="text"
                      value={sanctions}
                      onChange={(e) => setSanctions(e.target.value)}
                      placeholder="e.g. Warning issued, Confiscation..."
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Submitting...' : 'Register Formal Case'}
                  </button>
                </form>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredCases.slice(0, 15).map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                          <td className="px-4 py-4">
                            <div className="font-bold">{c.student ? c.student.fullName : c.staff?.fullName}</div>
                            <div className="text-[10px] text-gray-400">{c.student ? c.student.studentId : c.staff?.staffId}</div>
                          </td>
                          <td className="px-4 py-4">{c.offenseType}</td>
                          <td className="px-4 py-4 text-center font-mono text-gray-500">{new Date(c.incidentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${c.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
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