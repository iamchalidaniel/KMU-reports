"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import Notification, { useNotification } from '../../components/Notification';
import AIAssistant from '../../components/AIAssistant';
import Link from 'next/link';

interface Report {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Case {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  sanctions?: string;
  createdAt: string;
}

interface Appeal {
  _id: string;
  reportId: string;
  reason: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'cases' | 'appeals'>('overview');

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
      if (!user || user.role !== 'student') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    async function fetchFullProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch full profile:', err);
      }
    }
    if (token && user?.role === 'student') {
      fetchFullProfile();
    }
  }, [token, user]);

  useEffect(() => {
    if (user?.studentId) {
      fetchReports();
      fetchCases();
      fetchAppeals();
    }
  }, [user?.studentId]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student-reports`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases?studentId=${user?.studentId}`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCases(Array.isArray(data) ? data : (data.cases || []));
    } catch (err: any) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, {
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch appeals:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kmuGreen"></div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return <div className="p-12 text-center text-red-600">Access denied.</div>;
  }

  const studentData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Student Profile Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="text-9xl font-black">KMU</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {studentData.name ? studentData.name.charAt(0).toUpperCase() : studentData.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{studentData.fullName || studentData.name || 'Student Portal'}</h1>
                <p className="text-sm text-gray-500 font-semibold mt-1">ID: {studentData.studentId} • {studentData.program}</p>
                <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start border-t border-gray-100 dark:border-gray-800 pt-4">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Registry Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    My Statements
                  </button>
                  <button
                    onClick={() => setActiveTab('cases')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${activeTab === 'cases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Disciplinary Ledger
                  </button>
                  <button
                    onClick={() => setActiveTab('appeals')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${activeTab === 'appeals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    Appeals Portal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Strategic Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Disciplinary Cases" value={cases.length} color="indigo" />
                <StatCard title="Statement Filings" value={reports.length} color="blue" />
                <StatCard title="Active Appeals" value={appeals.filter(a => a.status === 'Pending').length} color="orange" />
                <StatCard title="Current Sanctions" value={cases.filter(c => !!c.sanctions).length} color="emerald" />
              </div>

              {/* Personal Information Ledger */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Official Student Registry Record</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                  <InfoField label="Academic Program" value={studentData.program} />
                  <InfoField label="Year of Study" value={studentData.yearOfStudy} />
                  <InfoField label="Delivery Mode" value={studentData.deliveryMode} />
                  <InfoField label="Gender" value={studentData.gender} />
                  <InfoField label="NRC Number" value={studentData.nrc} />
                  <InfoField label="Contact Mobile" value={studentData.phone} />
                  <InfoField label="University Email" value={studentData.email} />
                  <InfoField label="Residential Unit" value={studentData.roomNo || 'Non-Resident'} />
                  <InfoField label="Registry Status" value={studentData.status || 'ACTIVE'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-indigo-600">Statement History Ledger</h2>
              </div>
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left">Incident Date</th>
                      <th className="px-8 py-5 text-left">Classification</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {reports.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-8 py-5 font-mono text-gray-500">{formatDate(r.incidentDate)}</td>
                        <td className="px-8 py-5 font-bold uppercase text-gray-900 dark:text-gray-100">{r.offenseType}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter border ${r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-10 text-center text-gray-400 italic font-serif">Empty statement registry.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-red-600">Official Disciplinary Ledger</h2>
              </div>
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left">Indictment Date</th>
                      <th className="px-8 py-5 text-left">Offense Index</th>
                      <th className="px-8 py-5 text-center">Protocol Status</th>
                      <th className="px-8 py-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cases.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-8 py-5 font-mono text-gray-500">{formatDate(c.incidentDate)}</td>
                        <td className="px-8 py-5">
                          <div className="font-bold uppercase text-gray-900 dark:text-gray-100">{c.offenseType}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">{c.description}</div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-black text-[9px] uppercase tracking-tighter border border-red-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-all">Command View →</button>
                        </td>
                      </tr>
                    ))}
                    {cases.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic font-serif">No disciplinary indictments found in registry.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'appeals' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-orange-600 mb-8">Petition for Appeal Registry</h2>
                <div className="space-y-4 font-sans">
                  {appeals.map((appeal) => (
                    <div key={appeal._id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-transparent hover:border-orange-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-tighter text-gray-900 dark:text-white">Appeal Ref: {appeal._id.substring(0, 8).toUpperCase()}</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Submitted: {formatDate(appeal.createdAt)}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-[9px] uppercase tracking-tighter">
                          {appeal.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mb-4">"{appeal.reason}"</p>
                      {appeal.adminResponse && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Registry Response:</p>
                          <p className="text-xs text-gray-800 dark:text-gray-200 font-medium">{appeal.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {appeals.length === 0 && (
                    <div className="text-center py-24 text-gray-400 italic text-sm font-serif border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">No active petitions in the registry.</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
      <AIAssistant formType="appeal" />
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50',
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight italic">{value}</div>
    </div>
  );
}

function InfoField({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1.5 bg-gray-50/30 dark:bg-gray-800/30 p-4 rounded-2xl border border-transparent hover:border-indigo-500/10 transition-all">
      <label className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">{label}</label>
      <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">
        {value || 'Not Registered'}
      </div>
    </div>
  );
}
