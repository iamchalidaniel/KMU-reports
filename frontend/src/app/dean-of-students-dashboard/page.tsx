"use client";

import { useState, useEffect } from 'react';

import { saveAs } from 'file-saver';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function DeanOfStudentsDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  // Handle authentication like profile page - only on client side
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
      if (!user || user.role !== 'dean_of_students') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

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
        const casesRes = await fetch(`${API_BASE_URL}/api/cases`, { headers: { ...authHeaders() } });
        const studentsRes = await fetch(`${API_BASE_URL}/api/students`, { headers: { ...authHeaders() } });

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.cases || casesData || []);
        } else {
          console.error('Failed to fetch cases:', casesRes.status);
          setCases([]);
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || studentsData || []);
        } else {
          console.error('Failed to fetch students:', studentsRes.status);
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

  const handleGenerateSummary = async () => {
    if (cases.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const descriptions = cases.slice(0, 30).map(c => c.description).filter(d => !!d);
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

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen">Loading...</div>;
  }

  if (!user || user.role !== 'dean_of_students') {
    return <div className="text-red-600">Access denied.</div>;
  }

  async function exportCasesToWord() {
    try {
      // Prepare chart data
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
            title: 'Dean of Students Dashboard - All Cases Report',
            url: window.location.href
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'dean_of_students_all_cases_report.docx');
    } catch (err) {
      console.error('Export cases error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  // Visualization data
  const totalCases = filteredCases.length;
  const totalStudents = safeStudents.length;
  const openCases = filteredCases.filter(c => c.status === 'Open').length;
  const highSeverityCases = filteredCases.filter(c => c.severity === 'High' || c.severity === 'Critical').length;

  const departmentCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  filteredCases.forEach((c: Case) => {
    if (c.student?.department) departmentCounts[c.student.department] = (departmentCounts[c.student.department] || 0) + 1;
    if (c.severity) severityCounts[c.severity] = (severityCounts[c.severity] || 0) + 1;
  });

  const departmentChartData = {
    labels: Object.keys(departmentCounts),
    datasets: [
      {
        label: 'Cases by Department',
        data: Object.values(departmentCounts),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
    ],
  };

  const severityChartData = {
    labels: Object.keys(severityCounts),
    datasets: [
      {
        label: 'Cases by Severity',
        data: Object.values(severityCounts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',   // Low - Green
          'rgba(251, 191, 36, 0.7)',  // Medium - Yellow
          'rgba(249, 115, 22, 0.7)',  // High - Orange
          'rgba(239, 68, 68, 0.7)',   // Critical - Red
        ],
      },
    ],
  };

  if (profileLoading && !profile) {
    return <div className="text-center text-kmuGreen p-8">Loading dashboard...</div>;
  }

  const staffData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Dashboard Header / Banner area */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-teal-600 to-kmuGreen relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                  {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'Staff Name'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Staff ID : <span className="text-teal-600 dark:text-teal-400 font-mono">{staffData.staffId || staffData.username}</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="All Cases" icon="⚖️" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
                <NavButton label="Manage Students" icon="🎓" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
                <NavButton label="Staff Info" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Settings" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tighter">Campus Overview</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Live Analytics & AI Behavior Tracking</p>
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing || cases.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-kmuGreen hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    {isSummarizing ? "⏳ ANALYZING..." : "✨ AI BEHAVIORAL ANALYSIS"}
                  </button>
                </div>

                {aiSummary && (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in zoom-in duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-widest">Administrative behavioral insight</span>
                      </div>
                      <button onClick={() => setAiSummary(null)} className="text-emerald-600 hover:text-emerald-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                      {aiSummary}
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800 text-[10px] text-emerald-600/60 italic">
                      Note: This analysis is synthesized from anonymized incident descriptions to protect student privacy.
                    </div>
                  </div>
                )}
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Students" value={totalStudents} color="teal" />
                  <StatCard title="Total Cases" value={totalCases} color="orange" />
                  <StatCard title="Open Cases" value={openCases} color="blue" />
                  <StatCard title="High Priority" value={highSeverityCases} color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-200">Cases by Program</h3>
                    <Bar data={departmentChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-200">Cases by Severity</h3>
                    <Bar data={severityChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  </div>
                </div>

                {/* Export Buttons in Dashboard */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold mb-4">Export & Reports</h3>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      className="bg-kmuGreen text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition shadow-sm"
                      onClick={exportCasesToWord}
                    >
                      Export All Cases (DOCX)
                    </button>
                    <Link
                      href="/reports"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition shadow-sm inline-block"
                    >
                      View Detailed Reports
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold">Recent High-Priority Cases</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <input
                        placeholder="Search cases..."
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <Link href="/cases" className="text-sm text-teal-600 font-bold whitespace-nowrap hover:underline">View All →</Link>
                    </div>
                  </div>

                  <div className="overflow-x-auto border rounded-xl border-gray-100 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-4 text-left font-bold uppercase text-[10px] tracking-wider">Student</th>
                          <th className="px-4 py-4 text-left font-bold uppercase text-[10px] tracking-wider">Offense/Date</th>
                          <th className="px-4 py-4 text-center font-bold uppercase text-[10px] tracking-wider">Severity</th>
                          <th className="px-4 py-4 text-center font-bold uppercase text-[10px] tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCases
                          .filter(c => c.severity === 'High' || c.severity === 'Critical')
                          .sort((a, b) => new Date(b.createdAt || b.incidentDate || 0).getTime() - new Date(a.createdAt || a.incidentDate || 0).getTime())
                          .slice(0, 15)
                          .map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                              <td className="px-4 py-4">
                                <div className="font-bold">{c.student?.fullName || 'Unknown'}</div>
                                <div className="text-[10px] text-gray-500">{c.student?.studentId} • {c.student?.department}</div>
                              </td>
                              <td className="px-4 py-4 text-xs">
                                <div className="font-semibold text-gray-700 dark:text-gray-300">{c.offenseType}</div>
                                <div className="text-[10px] text-gray-500">{c.incidentDate || 'N/A'}</div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                  c.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                    c.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                  {c.severity}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                  c.status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {filteredCases.filter(c => c.severity === 'High' || c.severity === 'Critical').length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-gray-500 italic">No high-priority cases found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Student Registry</h2>
                    <Link href="/students" className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition text-sm">Manage Students</Link>
                  </div>

                  <div className="mb-6">
                    <input
                      placeholder="Search student ID, name..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 w-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.slice(0, 12).map((s, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer" onClick={() => router.push(`/students/${s._id}`)}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 font-bold">
                            {s.fullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm line-clamp-1">{s.fullName}</div>
                            <div className="text-[10px] text-gray-500">{s.studentId}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-2">
                          <span className="block">{s.program || 'N/A'}</span>
                          <span className="block font-semibold">{s.department || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredStudents.length > 12 && (
                    <div className="mt-6 text-center">
                      <Link href="/students" className="text-teal-600 font-bold text-sm hover:underline">View All {filteredStudents.length} Students</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
                <div className="space-y-10">
                  {/* Section: ACCOUNT DETAILS */}
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Account Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Staff ID" value={staffData.staffId || staffData.username} />
                      <InfoField label="Role" value={staffData.role?.toUpperCase().replace('_', ' ')} />
                      <InfoField label="Status" value="ACTIVE" />
                    </div>
                  </section>

                  {/* Section: PERSONAL INFO */}
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Personal Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="First Name" value={staffData.firstName || staffData.name?.split(' ')[1] || ''} />
                      <InfoField label="Sur Name" value={staffData.surName || staffData.name?.split(' ')[0] || ''} />
                      <InfoField label="NRC" value={staffData.nrc || ''} />
                      <InfoField label="Gender" value={staffData.gender || ''} />
                      <InfoField label="Marital Status" value={staffData.maritalStatus || ''} />
                      <InfoField label="Nationality" value={staffData.nationality || ''} />
                      <InfoField label="Date of birth" value={staffData.dateOfBirth || ''} />
                    </div>
                  </section>

                  {/* Section: ADDRESS */}
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Province" value={staffData.province || ''} />
                      <InfoField label="Town" value={staffData.town || ''} />
                      <InfoField label="Address" value={staffData.address || ''} />
                      <InfoField label="Phone" value={staffData.phone || ''} />
                      <InfoField label="Email" value={staffData.email || ''} />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300 max-w-md mx-auto">
                <h2 className="2xl font-bold text-teal-600 mb-8 text-center">Security Settings</h2>
                <div className="space-y-6">
                  <FormField label="Current Password" type="password" />
                  <FormField label="New Password" type="password" />
                  <button
                    onClick={() => showNotification('info', 'Feature coming soon')}
                    className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 transition uppercase tracking-wider"
                  >
                    Update Security
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {notification?.isVisible && (
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}

// UI Components
function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10 text-teal-600'
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
    teal: 'text-teal-600 border-teal-100',
    orange: 'text-orange-600 border-orange-100',
    blue: 'text-blue-600 border-blue-100',
    red: 'text-red-600 border-red-100'
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
      <label className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}

function FormField({ label, type = 'text' }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-tighter ml-1">{label}</label>
      <input
        type={type}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
      />
    </div>
  );
}