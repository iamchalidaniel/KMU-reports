"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
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
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);

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
      if (!user || user.role !== 'admin') {
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

        const [usersRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/student-reports`, { headers: { ...authHeaders() } })
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || data || []);
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data.reports || data || []);
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

  const safeCases = Array.isArray(cases) ? cases : [];
  const safeStudents = Array.isArray(students) ? students : [];

  useEffect(() => {
    let result = safeCases;
    if (search) {
      result = result.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (programFilter) {
      result = result.filter((c: any) => c.student?.program === programFilter);
    }
    setFilteredCases(result);
  }, [search, cases, programFilter]);

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
            title: 'Admin Panel Full Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'admin_full_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="text-red-600 p-12">Access denied. Administrator privileges required.</div>;
  }

  const staffData = profile || user;

  // Analytics Calculations
  const analyticsCases = programFilter
    ? safeCases.filter((c: any) => c.student?.program === programFilter)
    : safeCases;

  const offenceCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};

  analyticsCases.forEach((c: any) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });

  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Maintenance Analytics
  const maintenanceReports = Array.isArray(reports) ? reports : [];
  const filteredMaintenance = hostelFilter
    ? maintenanceReports.filter((r: any) => r.location?.hall === hostelFilter)
    : maintenanceReports;

  const maintenanceCounts: Record<string, number> = {};
  filteredMaintenance.forEach((r: any) => {
    if (r.category) maintenanceCounts[r.category] = (maintenanceCounts[r.category] || 0) + 1;
  });
  const topMaintenance = Object.entries(maintenanceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const offenceChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Offenses',
      data: topOffences.map(([, count]) => count),
      backgroundColor: '#059669'
    }]
  };

  const maintenanceChartData = {
    labels: topMaintenance.map(([cat]) => cat),
    datasets: [{
      label: 'Issues',
      data: topMaintenance.map(([, count]) => count),
      backgroundColor: '#3b82f6'
    }]
  };

  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));
  const hostels = Array.from(new Set(maintenanceReports.map((r: any) => r.location?.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Nav */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Analytics" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="All Cases" icon="⚖️" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
                <NavButton label="Maintenance" icon="🔧" active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} />
              </nav>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Students" value={safeStudents.length} color="emerald" />
                  <StatCard title="Active Cases" value={safeCases.filter((c: any) => c.status !== 'Closed').length} color="teal" />
                  <StatCard title="Maintenance" value={maintenanceReports.length} color="blue" />
                  <StatCard title="Total Users" value={users.length} color="green" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Disciplinary Analytics */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Disciplinary Offenses</h3>
                      <select
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-xs outline-none"
                        value={programFilter}
                        onChange={(e) => setProgramFilter(e.target.value)}
                      >
                        <option value="">All Programs</option>
                        {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="h-64">
                      <Bar data={offenceChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>

                  {/* Maintenance Analytics */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Maintenance Issues</h3>
                      <select
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-xs outline-none"
                        value={hostelFilter}
                        onChange={(e) => setHostelFilter(e.target.value)}
                      >
                        <option value="">All Hostels</option>
                        {hostels.map((h: any) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="h-64">
                      <Bar data={maintenanceChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>

                {/* Most Common Offenders */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Most Common Offenders</h3>
                  <div className="space-y-4">
                    {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <span className="font-medium">{name}</span>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{count} Cases</span>
                      </div>
                    )) : <p className="text-center text-gray-500 py-8">No offender data found.</p>}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">System Audit</h3>
                    <p className="text-sm text-gray-500">Generate comprehensive university-wide activity and disciplinary reports.</p>
                  </div>
                  <button onClick={exportCasesToWord} className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition">EXPORT FULL AUDIT (DOCX)</button>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Active Cases Review</h2>
                    <div className="flex gap-2">
                      <input
                        placeholder="Search cases..."
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <select
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                        value={programFilter}
                        onChange={(e) => setProgramFilter(e.target.value)}
                      >
                        <option value="">All Programs</option>
                        {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                        <tr>
                          <th className="px-4 py-4 text-left">Student</th>
                          <th className="px-4 py-4 text-left">Offense</th>
                          <th className="px-4 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCases.slice(0, 15).map((c: any, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-4">
                              <div className="font-bold">{c.student?.fullName}</div>
                              <div className="text-[10px] text-gray-400">{c.student?.studentId} • {c.student?.program}</div>
                            </td>
                            <td className="px-4 py-4">{c.offenseType}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Maintenance Logs</h2>
                    <select
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                      value={hostelFilter}
                      onChange={(e) => setHostelFilter(e.target.value)}
                    >
                      <option value="">All Hostels</option>
                      {hostels.map((h: any) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                        <tr>
                          <th className="px-4 py-4 text-left">Location</th>
                          <th className="px-4 py-4 text-left">Category</th>
                          <th className="px-4 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredMaintenance.slice(0, 15).map((r: any, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-4">
                              <div className="font-bold">{r.location?.hall}</div>
                              <div className="text-[10px] text-gray-400">Room {r.location?.room || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-4 uppercase font-medium">{r.category}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800'
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
    emerald: 'text-emerald-700 border-emerald-100',
    teal: 'text-teal-700 border-teal-100',
    blue: 'text-blue-700 border-blue-100',
    green: 'text-green-700 border-green-100'
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
      <label className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}