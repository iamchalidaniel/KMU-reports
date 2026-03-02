"use client";
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import Notification, { useNotification } from '../../components/Notification';
import Link from 'next/link';

interface StudentReport {
  _id: string;
  student_name?: string;
  incident_date: string;
  description: string;
  offense_type?: string;
  severity: string;
  status: string;
}

export default function ReportsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

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
      if (!user || !['admin', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary', 'security_officer'].includes(user.role)) {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  async function fetchStudentReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/student-reports?${params}`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStudentReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) fetchStudentReports();
  }, [user, page, statusFilter, severityFilter, search]);

  const handleApproveReport = async (reportId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student-reports/${reportId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (res.ok) {
        showNotification('success', 'Report authorized');
        fetchStudentReports();
      }
    } catch (err) {
      showNotification('error', 'Authorization failed');
    }
  };

  const handleConvertToCase = async (reportId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student-reports/${reportId}/convert-to-case`, {
        method: 'POST',
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        showNotification('success', 'Converted to formal case dossier');
        fetchStudentReports();
      }
    } catch (err) {
      showNotification('error', 'Conversion failed');
    }
  };

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-serif">Initializing Intelligence Ledger...</div>;
  }

  if (!user || !['admin', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary', 'security_officer'].includes(user.role)) {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-[2rem] border-t-4 border-orange-500 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Intelligence Command</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                KMU Unified Student Incident Reporting & Analytics
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                📡 {total} Active Ingress
              </span>
            </div>
          </div>

          {/* Strategic Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Reports" value={total} color="orange" />
            <StatCard title="Pending Review" value={studentReports.filter(r => r.status === 'Pending').length} color="amber" />
            <StatCard title="High Alert" value={studentReports.filter(r => r.severity === 'High').length} color="red" />
            <StatCard title="Analytic Sync" value="Live Feed" color="blue" />
          </div>

          {/* Central Reports Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-10 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-orange-600">Incident Ingress Ledger</h2>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto font-sans">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Query ingress metadata..."
                      className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs w-full focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500 transition-all font-sans"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Approved">Approved</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">
                  <tr>
                    <th className="px-10 py-6 text-left">Subject designation</th>
                    <th className="px-10 py-6 text-left">Classification</th>
                    <th className="px-10 py-6 text-center">Severity Index</th>
                    <th className="px-10 py-6 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {studentReports.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 group transition-all duration-300">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-black text-xs uppercase group-hover:rotate-12 transition-transform">
                            {r.student_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-tighter">
                              {r.student_name || 'Anonymous Submission'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter mt-0.5">{new Date(r.incident_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight truncate max-w-[200px]">{r.description}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">{r.offense_type || 'Unclassified'}</div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${r.severity === 'High' ? 'bg-red-100 text-red-600 border border-red-200 shadow-sm' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {r.severity} Priority
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {r.status === 'Pending' && (
                            <button onClick={() => handleApproveReport(r._id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Authorize</button>
                          )}
                          {(r.status === 'Pending' || r.status === 'Approved') && (
                            <button onClick={() => handleConvertToCase(r._id)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Convert</button>
                          )}
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700`}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {studentReports.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center text-gray-400 italic text-sm">Ingress query returned zero entities.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Premium Pagination */}
            <div className="p-10 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {studentReports.length} of {total} Ingress Clusters</span>
              <div className="flex items-center gap-1">
                <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev Cluster</PaginationButton>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).filter(p => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${p === page ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
                <PaginationButton onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page === Math.ceil(total / limit) || total === 0}>Next Cluster</PaginationButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification?.isVisible && <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50',
    amber: 'text-amber-700 bg-amber-50/30 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    red: 'text-red-700 bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tighter italic">{value}</div>
    </div>
  );
}

function PaginationButton({ children, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${disabled ? 'text-gray-300' : 'text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
    >
      {children}
    </button>
  );
}
