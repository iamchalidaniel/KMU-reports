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
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChiefSecurityOfficerDashboard() {
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
      if (!user || user.role !== 'chief_security_officer') {
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
          const casesData = await casesRes.json();
          setCases(casesData.cases || casesData || []);
        } else {
          setCases([]);
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || studentsData || []);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setCases([]);
        setStudents([]);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
    }
  }, [token]);

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
            title: 'Chief Security Officer Dashboard Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'chief_security_officer_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'chief_security_officer') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const staffData = profile || user;

  // Visualization data
  const offenceCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};
  filteredCases.forEach((c: Case) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });
  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const offenceChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Cases',
      data: topOffences.map(([, count]) => count),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
    }],
  };
  const offenderChartData = {
    labels: topOffenders.map(([name]) => name),
    datasets: [{
      label: 'Cases',
      data: topOffenders.map(([, count]) => count),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Banner Area */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-red-600 to-black relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'Chief Security Officer'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Staff ID : <span className="text-red-600 dark:text-red-400 font-mono">{staffData.staffId || staffData.username}</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Dashboard" icon="🚔" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="Case Review" icon="⚖️" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
                <NavButton label="Staff Info" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Settings" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Cases" value={filteredCases.length} color="red" />
                  <StatCard title="Open" value={filteredCases.filter(c => c.status === 'Open').length} color="blue" />
                  <StatCard title="High Priority" value={filteredCases.filter(c => c.severity === 'High').length} color="orange" />
                  <StatCard title="Total Students" value={safeStudents.length} color="teal" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold mb-6 uppercase text-xs tracking-widest text-red-600">Offence Frequency</h3>
                    <Bar data={offenceChartData} options={{ indexAxis: 'y' }} />
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold mb-6 uppercase text-xs tracking-widest text-blue-600">Top Offenders</h3>
                    <Bar data={offenderChartData} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">Security Reporting</h3>
                    <p className="text-sm text-gray-500">Generate and export disciplinary case reports.</p>
                  </div>
                  <button onClick={exportCasesToWord} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg">EXPORT DOCX</button>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Recent Security Incidents</h2>
                    <input
                      placeholder="Filter cases..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold uppercase text-gray-400">
                        <tr>
                          <th className="px-4 py-4 text-left">Student</th>
                          <th className="px-4 py-4 text-left">Offense</th>
                          <th className="px-4 py-4 text-center">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCases.slice(0, 15).map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                            <td className="px-4 py-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px]">{c.student?.fullName?.charAt(0)}</div>
                              <div>
                                <div className="font-bold">{c.student?.fullName}</div>
                                <div className="text-[10px] text-gray-400">{c.student?.studentId}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium">{c.offenseType}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                  c.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                }`}>{c.severity}</span>
                            </td>
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
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300 max-w-md mx-auto text-center py-12">
                <h2 className="text-2xl font-bold text-red-600 mb-8">System Security</h2>
                <p className="text-sm text-gray-500 mb-8">Manage your account security and password settings here.</p>
                <button onClick={() => showNotification('info', 'Feature coming soon')} className="w-full bg-black dark:bg-white dark:text-gray-900 text-white font-bold py-4 rounded-xl hover:shadow-xl transition">CHANGE ACCESS PASSWORD</button>
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
        ? 'border-red-600 bg-red-50 dark:bg-red-900/10 text-red-600'
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
    red: 'text-red-600 border-red-100',
    blue: 'text-blue-600 border-blue-100',
    orange: 'text-orange-600 border-orange-100',
    teal: 'text-teal-600 border-teal-100'
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
      <label className="text-[10px] font-extrabold text-red-700 dark:text-red-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}