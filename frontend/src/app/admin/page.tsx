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
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
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
    setFilteredCases(
      search ? safeCases.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      ) : safeCases
    );
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

  // Visuals
  const offenceCounts: Record<string, number> = {};
  safeCases.forEach((c: any) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
  });
  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const offenceChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Frequency',
      data: topOffences.map(([, count]) => count),
      backgroundColor: '#059669'
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Banner */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-emerald-800 to-black relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'System Admin'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Access Level : <span className="text-emerald-700 dark:text-emerald-500 font-mono">SUPERNODE / ADMIN</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Nav */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="System Health" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="User Management" icon="👥" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <NavButton label="Logs & History" icon="📜" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <NavButton label="Staff Info" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Settings" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Users" value={safeStudents.length + 10} color="emerald" />
                  <StatCard title="Total Cases" value={safeCases.length} color="teal" />
                  <StatCard title="Active Reports" value={5} color="blue" />
                  <StatCard title="System Alerts" value={0} color="green" />
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Disciplinary Analytics</h3>
                  <div className="h-64">
                    <Bar data={offenceChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">Maintenance & Reports</h3>
                    <p className="text-sm text-gray-500">Generate global system reports and audit logs.</p>
                  </div>
                  <button onClick={exportCasesToWord} className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition">EXPORT AUDIT (DOCX)</button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center py-24">
                  <h2 className="text-3xl font-bold mb-4">Identity Management</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Oversee all student profiles, staff accounts, and role-based permissions.</p>
                  <div className="flex justify-center gap-4">
                    <Link href="/admin/users" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition">Manage Staff/Admins</Link>
                    <Link href="/students" className="border border-emerald-600 text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition">Registry Operations</Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Audit Logs</h2>
                    <input
                      placeholder="Filter logs..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                        <tr>
                          <th className="px-4 py-4 text-left">Timestamp</th>
                          <th className="px-4 py-4 text-left">Action</th>
                          <th className="px-4 py-4 text-left">User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
                        {filteredCases.slice(0, 15).map((c: any, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-4 font-mono">{new Date(c.createdAt || 0).toLocaleString()}</td>
                            <td className="px-4 py-4 font-bold text-gray-900 dark:text-white uppercase tracking-tighter">CASE_RECORDED: {c.offenseType}</td>
                            <td className="px-4 py-4">{c.reportedBy?.name || 'SYSTEM'}</td>
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
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Administrative Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Admin ID" value={staffData.staffId || staffData.username} />
                      <InfoField label="System Role" value="ROOT_ADMINISTRATOR" />
                      <InfoField label="Status" value="PROVISIONED" />
                    </div>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Meta Data</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="First Name" value={staffData.firstName} />
                      <InfoField label="Sur Name" value={staffData.surName} />
                      <InfoField label="Phone" value={staffData.phone} />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center max-w-md mx-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-emerald-700">Access Key</h2>
                <p className="text-sm text-gray-500 mb-8">Update your administrative credentials and multi-factor settings.</p>
                <button onClick={() => showNotification('info', 'Feature coming soon')} className="w-full bg-emerald-800 text-white font-bold py-4 rounded-xl hover:shadow-2xl transition tracking-widest text-xs uppercase">ROTATE ACCESS KEY</button>
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