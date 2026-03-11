"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import { CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Chart as ChartJS } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChiefSecurityOfficerDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);

  useEffect(() => {
    if (!authLoading && (!token || user?.role !== 'chief_security_officer')) {
      router.replace('/login');
    } else if (!authLoading) {
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
        const [casesRes, studentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } })
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.cases || casesData || []);
        }
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || studentsData || []);
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

  useEffect(() => {
    let result = cases;
    if (search) {
      result = result.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredCases(result);
  }, [search, cases]);

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
          pageInfo: { title: 'CSO High-Level Report', url: typeof window !== 'undefined' ? window.location.href : '' }
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'cso_strategic_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth || (authLoading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'chief_security_officer') {
    return <div className="p-12 text-center text-red-600">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Security Intelligence</h1>
              <p className="text-xs text-blue-600 font-semibold mt-1 uppercase tracking-wider">CSO Command Center</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                📊 Export Insight
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Strategic Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/chief-security-officer-dashboard/cases" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">🛡️</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-blue-600 transition-colors">Unified Registry</div>
                    <div className="text-[10px] text-gray-500">All university incidents</div>
                  </div>
                </Link>
                <Link href="/chief-security-officer-dashboard/reports" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">📉</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Strategic Reports</div>
                    <div className="text-[10px] text-gray-500">Security performance</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* CSO Status Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Operational Scope</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="text-xl font-black text-gray-900 dark:text-white tracking-widest uppercase">UNIVERSITY-WIDE</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Command ID</div>
                <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{user?.id?.slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Global Cases" value={cases.length} color="red" />
            <StatCard title="Active Inquiries" value={cases.filter(c => c.status === 'Open').length} color="blue" />
            <StatCard title="Critical Incidents" value={cases.filter(c => c.severity === 'Critical').length} color="orange" />
            <StatCard title="Student Population" value={students.length} color="indigo" />
          </div>

          {/* Incident Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/20">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Strategic Case Ledger</h2>
              <Link href="/chief-security-officer-dashboard/cases" className="text-xs font-bold text-blue-600 hover:underline">Full Registry →</Link>
            </div>
            <div className="overflow-x-auto">
              
              {/* Desktop Table View */}
              <table className="w-full text-xs hidden md:table">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 5).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-500">{c.student?.studentId || 'EXT'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{c.offenseType}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[10px] font-bold ${c.severity === 'Critical' ? 'text-red-600 underline' : 'text-gray-400'}`}>
                          {c.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
                {filteredCases.slice(0, 5).map((c, i) => (
                  <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-lg mb-2 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-800 dark:text-gray-200">{c.student?.fullName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-500">{c.student?.studentId || 'EXT'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-gray-600 dark:text-gray-400 font-medium text-xs">{c.offenseType}</div>
                      <span className={`text-[10px] font-bold ${c.severity === 'Critical' ? 'text-red-600 underline' : 'text-gray-400'}`}>
                        {c.severity}
                      </span>
                    </div>
                  </div>
                ))}
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
    red: 'border-red-500 dark:border-red-400',
    blue: 'border-blue-500 dark:border-blue-400',
    orange: 'border-orange-500 dark:border-orange-400',
    indigo: 'border-indigo-500 dark:border-indigo-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all hover:scale-[1.01] ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}
