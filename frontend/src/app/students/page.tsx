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
      showNotification('success', 'Student added successfully');
      loadStudents();
    } catch (err: any) {
      showNotification('error', err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this student record? This action cannot be undone.')) return;
    try {
      await remove('students', id);
      showNotification('success', 'Student deleted successfully');
      loadStudents();
    } catch (err: any) {
      showNotification('error', 'Failed to delete student');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-sans">Loading students...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Registry Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Student Registry</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                Manage student records and enrollment {offlineMode && <span className="text-orange-500 font-bold ml-2">• OFFLINE MODE ON</span>}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {(user?.role === 'admin' || user?.role === 'academic_office') && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  👤 Add New Student
                </button>
              )}
              <Link
                href="/students/import"
                className="bg-gray-800 dark:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center w-full sm:w-auto text-center"
              >
                Bulk Import
              </Link>
            </div>
          </div>

          {/* Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={total} color="emerald" />
            <StatCard title="Active Programs" value={PROGRAMS.length} color="teal" />
            <StatCard title="System Status" value={offlineMode ? "Cached" : "Live"} color="blue" />
            <StatCard title="Verification" value="Verified" color="indigo" />
          </div>

          {/* Central Registry Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-emerald-600">Students List</h2>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto font-sans">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Search students..."
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    value={programFilter}
                    onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
                    className="w-full sm:w-auto bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  >
                    <option value="">All Programs</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Student Details</th>
                    <th className="px-6 py-4 text-left">Program Details</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((s, i) => (
                    <tr key={s._id || i} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase transition-transform">
                            {s.fullName?.charAt(0)}
                          </div>
                          <div>
                            <Link href={`/students/${s._id}`} className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase text-sm tracking-tight">
                              {s.fullName}
                            </Link>
                            <div className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-tighter">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{s.program}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Year {s.year || 'N/A'} • {s.gender || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[9px] font-bold uppercase tracking-widest text-gray-500 rounded">Verified</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => router.push(`/students/${s._id}?tab=add-case`)} className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 transition-colors" title="Add Case">⚖️</button>
                          {(user?.role === 'admin' || user?.role === 'academic_office') && (
                            <button onClick={() => handleDelete(s._id!)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors" title="Delete Student">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">No students found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing {students.length} of {total} Records</span>
              <div className="flex items-center gap-1">
                <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</PaginationButton>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).filter(p => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${p === page ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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

      {/* Enlistment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Add Student</h2>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-1">Enter student details below</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 transition-all font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Student ID" value={formData.studentId} onChange={(v: string) => setFormData({ ...formData, studentId: v })} required />
                <FormField label="Full Name" value={formData.fullName} onChange={(v: string) => setFormData({ ...formData, fullName: v })} required />
                <FormField label="Program" value={formData.program} onChange={(v: string) => setFormData({ ...formData, program: v })} required />
                <FormField label="Year" value={formData.year} onChange={(v: string) => setFormData({ ...formData, year: v })} type="select" options={YEARS.map(y => ({ value: y, label: `Year ${y}` }))} />
                <FormField label="Gender" value={formData.gender} onChange={(v: string) => setFormData({ ...formData, gender: v })} type="select" options={GENDERS.map(g => ({ value: g, label: g }))} />
              </div>
              <div className="mt-8 flex gap-4">
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-xs uppercase tracking-widest">
                  {loading ? 'Saving...' : 'Add Student'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  Cancel
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
    emerald: 'border-emerald-500 dark:border-emerald-400',
    teal: 'border-teal-500 dark:border-teal-400',
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

function FormField({ label, value, onChange, type = 'text', options = [], required = false }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold uppercase">
          <option value="">Select...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold" />
      )}
    </div>
  );
}

function PaginationButton({ children, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${disabled ? 'text-gray-300' : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
    >
      {children}
    </button>
  );
}