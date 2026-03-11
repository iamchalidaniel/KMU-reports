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
        showNotification('success', 'Report approved');
        fetchStudentReports();
      }
    } catch (err) {
      showNotification('error', 'Approval failed');
    }
  };

  const handleConvertToCase = async (reportId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student-reports/${reportId}/convert-to-case`, {
        method: 'POST',
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        showNotification('success', 'Converted to official case');
        fetchStudentReports();
      }
    } catch (err) {
      showNotification('error', 'Conversion failed');
    }
  };

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-sans">Loading reports...</div>;
  }

  if (!user || !['admin', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary', 'security_officer'].includes(user.role)) {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Reports Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Incident Reports</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                View and manage student incident reports
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border border-orange-200">
                📡 {total} Active Reports
              </span>
            </div>
          </div>

          {/* Strategic Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Reports" value={total} color="orange" />
            <StatCard title="Pending Review" value={studentReports.filter(r => r.status === 'Pending').length} color="amber" />
            <StatCard title="High Priority" value={studentReports.filter(r => r.severity === 'High').length} color="red" />
          </div>

          {/* Central Reports Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-orange-600">Reports Registry</h2>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto font-sans">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Search reports..."
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-orange-500 transition-all font-sans"
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
              
              {/* Desktop Table View */}
              <table className="w-full text-xs hidden md:table">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Student Name</th>
                    <th className="px-6 py-4 text-left">Incident Type</th>
                    <th className="px-6 py-4 text-center">Severity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {studentReports.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-bold text-xs uppercase transition-transform">
                            {r.student_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-tight">
                              {r.student_name || 'Anonymous Submission'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">{new Date(r.incident_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight truncate max-w-[200px]">{r.description}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{r.offense_type || 'Unclassified'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${r.severity === 'High' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {r.severity} Priority
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {r.status === 'Pending' && (
                            <button onClick={() => handleApproveReport(r._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Approve</button>
                          )}
                          {(r.status === 'Pending' || r.status === 'Approved') && (
                            <button onClick={() => handleConvertToCase(r._id)} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Convert</button>
                          )}
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700`}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {studentReports.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">No reports found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {studentReports.map((r, i) => (
                  <div key={r._id || i} className="p-4 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-bold text-sm uppercase">
                          {r.student_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-tight">
                            {r.student_name || 'Anonymous Submission'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">{new Date(r.incident_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3 border-l-2 border-orange-400">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="font-bold text-gray-700 dark:text-gray-300 text-xs line-clamp-2">{r.description}</div>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${r.severity === 'High' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {r.severity}
                        </span>
                      </div>
                      <div className="text-[10px] text-orange-500 uppercase font-bold tracking-wider">{r.offense_type || 'Unclassified'}</div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 items-center">
                      <span className={`mr-auto px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700`}>
                        {r.status}
                      </span>
                      {r.status === 'Pending' && (
                        <button onClick={() => handleApproveReport(r._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">Approve</button>
                      )}
                      {(r.status === 'Pending' || r.status === 'Approved') && (
                        <button onClick={() => handleConvertToCase(r._id)} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">Convert</button>
                      )}
                    </div>
                  </div>
                ))}
                {studentReports.length === 0 && !loading && (
                  <div className="py-20 text-center text-gray-400 italic text-sm">No reports found matching your search.</div>
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing {studentReports.length} of {total} Records</span>
              <div className="flex items-center gap-1">
                <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</PaginationButton>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).filter(p => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${p === page ? 'bg-orange-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
                <PaginationButton onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page === Math.ceil(total / limit) || total === 0}>Next</PaginationButton>
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
    orange: 'border-orange-500 dark:border-orange-400',
    amber: 'border-amber-500 dark:border-amber-400',
    blue: 'border-blue-500 dark:border-blue-400',
    red: 'border-red-500 dark:border-red-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color]}`}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function PaginationButton({ children, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${disabled ? 'text-gray-300' : 'text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
    >
      {children}
    </button>
  );
}
