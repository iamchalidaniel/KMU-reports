"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authHeaders, remove } from '../../utils/api';
import { useOfflineApi } from '../../hooks/useOfflineSync';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { saveAs } from 'file-saver';
import Notification, { useNotification } from '../../components/Notification';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  department?: string;
  program?: string;
}

interface Case {
  _id: string;
  student?: Student;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['Open', 'Closed', 'Pending'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function CasesPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFilter = searchParams?.get('studentId') || '';
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const { apiCall } = useOfflineApi();
  const exportRef = useRef<HTMLDivElement>(null);

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
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (studentIdFilter) params.append('studentId', studentIdFilter);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiCall<any>('get', `/cases?${params.toString()}`);
      const responseData = response.data;
      const casesArray = Array.isArray(responseData) ? responseData : (responseData.cases || []);
      setCases(casesArray);
      setTotal(responseData.total || casesArray.length);
      setOfflineMode(response.offline);
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, [studentIdFilter, search, statusFilter, severityFilter, page]);

  const handleExportList = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/cases-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ filters: { search, status: statusFilter, severity: severityFilter, studentId: studentIdFilter } }),
      });
      if (res.ok) {
        const blob = await res.blob();
        saveAs(blob, `cases_ledger_${new Date().toISOString().split('T')[0]}.docx`);
        showNotification('success', 'Strategic document generated');
      }
    } catch (err) {
      showNotification('error', 'Export failure');
    } finally {
      setExporting(false);
      setShowExportDropdown(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Commit record purge? This operation is final.')) return;
    try {
      await remove('cases', id);
      showNotification('success', 'Case purged from index');
      fetchCases();
    } catch (err) {
      showNotification('error', 'Purge operation failed');
    }
  };

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-serif">Initializing Fleet Dossier...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Cases Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Case Command</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                KMU Disciplinary Enforcement & Litigation Registry {offlineMode && <span className="text-orange-500 font-bold ml-2">• OFFLINE PROTOCOL</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/cases/new"
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
              >
                ⚖️ Initiate New Inquiry
              </Link>
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="bg-gray-800 dark:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
                >
                  🚀 {exporting ? 'Synthesizing...' : 'Strategic Export'}
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 font-sans animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={handleExportList} className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase hover:bg-gray-50 dark:hover:bg-gray-700 transition">Full Ledger (DOCX)</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategic Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Global Inquiries" value={total} color="red" />
            <StatCard title="Open Protocols" value={cases.filter(c => c.status === 'Open').length} color="orange" />
            <StatCard title="Critical Index" value={cases.filter(c => c.severity === 'High' || c.severity === 'Critical').length} color="indigo" />
            <StatCard title="Operational Sync" value={offlineMode ? "Cached" : "Live"} color="blue" />
          </div>

          {/* Central Disciplinary Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-red-600">Strategic Compliance Ledger</h2>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto font-sans">
                  <div className="relative flex-1 lg:w-64">
                    <input
                      placeholder="Query metadata..."
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all font-sans"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={severityFilter}
                    onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all font-sans"
                  >
                    <option value="">All Severities</option>
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Entity Cluster</th>
                    <th className="px-6 py-4 text-left">Incident Classification</th>
                    <th className="px-6 py-4 text-center">Status Index</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cases.map((c, i) => (
                    <tr key={c._id || i} className="hover:bg-red-50/30 dark:hover:bg-red-950/10 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 font-bold text-xs uppercase">
                            {c.student?.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <Link href={`/cases/${c._id}`} className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-600 transition-colors uppercase text-sm tracking-tight">
                              {c.student?.fullName || 'Anonymous'}
                            </Link>
                            <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase">{c.student?.studentId || 'EXTERNAL'} • {c.student?.program || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{c.offenseType}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold flex items-center gap-2">
                          <span className={`${c.severity === 'Critical' ? 'text-red-600 animate-pulse' : c.severity === 'High' ? 'text-red-500' : 'text-gray-500'}`}>
                            {c.severity} Priority
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">•</span>
                          <span className="italic font-normal">{new Date(c.incidentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${c.status === 'Open' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Link href={`/cases/${c._id}`} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 transition-colors" title="View Dossier">📄</Link>
                          {(user?.role === 'admin' || user?.role === 'security_officer') && (
                            <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors" title="Purge Incident">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cases.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">Compliance registry query returned zero entities.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing {cases.length} of {total} Compliance Indices</span>
              <div className="flex items-center gap-1">
                <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</PaginationButton>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).filter(p => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${p === page ? 'bg-red-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
    red: 'border-red-500 dark:border-red-400',
    orange: 'border-orange-500 dark:border-orange-400',
    blue: 'border-blue-500 dark:border-blue-400',
    indigo: 'border-indigo-500 dark:border-indigo-400'
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
      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${disabled ? 'text-gray-300' : 'text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
    >
      {children}
    </button>
  );
}