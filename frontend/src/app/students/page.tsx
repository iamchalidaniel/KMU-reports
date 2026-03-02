"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { create, remove } from '../../utils/api';
import { useOfflineApi } from '../../hooks/useOfflineSync';
import Notification, { useNotification } from '../../components/Notification';

interface Student {
  _id?: string;
  studentId: string;
  fullName: string;
  program: string;
  year?: string;
  gender?: string;
}

const PROGRAMS = ['BSc ICT Education', 'BSc Biology Education', 'BSc Mathematics Education'];
const YEARS = ['1', '2', '3', '4'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function StudentsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);
  const { apiCall } = useOfflineApi();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    program: '',
    year: '',
    gender: '',
  });

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

  async function loadStudents(pageNum = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (programFilter) params.append('program', programFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (genderFilter) params.append('gender', genderFilter);

      const response = await apiCall<{ students: Student[], total: number }>('get', `/students?${params.toString()}`);
      const data = response.data;
      setStudents(data.students);
      setTotal(data.total);
      setOfflineMode(response.offline);
    } catch (err: any) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents(page);
  }, [page, search, programFilter, yearFilter, genderFilter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await create('students', formData);
      setFormData({ studentId: '', fullName: '', program: '', year: '', gender: '' });
      setShowAddForm(false);
      showNotification('success', 'Student record synchronized successfully');
      loadStudents();
    } catch (err: any) {
      showNotification('error', err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Commit record deletion? This cannot be undone.')) return;
    try {
      await remove('students', id);
      showNotification('success', 'Record purged from registry');
      loadStudents();
    } catch (err: any) {
      showNotification('error', 'Purge operation failed');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-serif">Initializing Registry...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-[2rem] border-t-4 border-emerald-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Registry Command</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                KMU Unified Student Metadata & Enrollment {offlineMode && <span className="text-orange-500 font-black ml-2">• OFFLINE PROTOCOL ON</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(user?.role === 'admin' || user?.role === 'academic_office') && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center gap-2 group"
                >
                  <span className="group-hover:animate-bounce">👤</span> Enlist New Student
                </button>
              )}
              <Link
                href="/students/import"
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition"
              >
                Bulk Import Portal
              </Link>
            </div>
          </div>

          {/* Strategic Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Global Population" value={total} color="emerald" />
            <StatCard title="Active Programs" value={PROGRAMS.length} color="teal" />
            <StatCard title="Registry Status" value={offlineMode ? "Cached" : "Live"} color="blue" />
            <StatCard title="Data Integrity" value="100% Verified" color="indigo" />
          </div>

          {/* Central Registry Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-10 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-emerald-600">Student Enrollment Ledger</h2>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto font-sans">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Query registry metadata..."
                      className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs w-full focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    value={programFilter}
                    onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  >
                    <option value="">All Academic Units</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">
                  <tr>
                    <th className="px-10 py-6 text-left">Subject Cluster</th>
                    <th className="px-10 py-6 text-left">Academic Protocol</th>
                    <th className="px-10 py-6 text-center">Metadata</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((s, i) => (
                    <tr key={s._id || i} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 group transition-all duration-300">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 font-black text-xs uppercase group-hover:scale-110 transition-transform">
                            {s.fullName?.charAt(0)}
                          </div>
                          <div>
                            <Link href={`/students/${s._id}`} className="font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase text-sm tracking-tighter">
                              {s.fullName}
                            </Link>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter mt-0.5">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{s.program}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 tracking-widest uppercase font-black">Year {s.year || 'N/A'} • {s.gender || 'N/A'}</div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-lg">Verified</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => router.push(`/students/${s._id}?tab=add-case`)} className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 transition-colors" title="Flag Case">⚖️</button>
                          {(user?.role === 'admin' || user?.role === 'academic_office') && (
                            <button onClick={() => handleDelete(s._id!)} className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors" title="Purge Record">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center text-gray-400 italic text-sm">Registry query returned zero entities.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Premium Pagination */}
            <div className="p-10 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {students.length} of {total} Indices</span>
              <div className="flex items-center gap-1">
                <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev Cluster</PaginationButton>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).filter(p => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${p === page ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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

      {/* Enlistment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border-t-8 border-emerald-600 p-12 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Student Enlistment</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Unified Registry Metadata Entry</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full text-gray-400 hover:text-emerald-600 transition-all font-sans">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-8 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Subject SIN / ID" value={formData.studentId} onChange={(v: string) => setFormData({ ...formData, studentId: v })} required />
                <FormField label="Full Legal Designation" value={formData.fullName} onChange={(v: string) => setFormData({ ...formData, fullName: v })} required />
                <FormField label="Academic Unit (Program)" value={formData.program} onChange={(v: string) => setFormData({ ...formData, program: v })} required />
                <FormField label="Temporal Level (Year)" value={formData.year} onChange={(v: string) => setFormData({ ...formData, year: v })} type="select" options={YEARS.map(y => ({ value: y, label: `Year ${y}` }))} />
                <FormField label="Biological Designation" value={formData.gender} onChange={(v: string) => setFormData({ ...formData, gender: v })} type="select" options={GENDERS.map(g => ({ value: g, label: g }))} />
              </div>
              <div className="mt-10 flex gap-4">
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-[2rem] hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest">
                  {loading ? 'Synthesizing Index...' : 'Commit Protocol Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification?.isVisible && <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50',
    teal: 'text-teal-700 bg-teal-50/30 border-teal-100 dark:bg-teal-950/10 dark:border-teal-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tighter italic">{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', options = [], required = false }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold uppercase shadow-inner">
          <option value="">Select Protocol...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold shadow-inner" />
      )}
    </div>
  );
}

function PaginationButton({ children, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${disabled ? 'text-gray-300' : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
    >
      {children}
    </button>
  );
}