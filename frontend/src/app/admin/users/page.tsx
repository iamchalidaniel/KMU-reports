"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../config/constants';
import { getAll, register, update, remove } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'security_officer', label: 'Security Officer' },
  { value: 'chief_security_officer', label: 'Chief Security Officer' },
  { value: 'dean_of_students', label: 'Dean of Students' },
  { value: 'assistant_dean', label: 'Assistant Dean' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'hall_warden', label: 'Hall Warden' },
  { value: 'student', label: 'Student' },
  { value: 'electrician', label: 'Electrician' },
];

export default function UserManagementPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', role: 'security_officer' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);

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

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await getAll('users');
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') fetchUsers();
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(newUser.username, newUser.password, newUser.name, newUser.role);
      showNotification('success', 'Operational identity synthesized');
      setShowCreate(false);
      setNewUser({ username: '', name: '', password: '', role: 'security_officer' });
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Identity creation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await update('users', editUser.id || editUser._id, {
        username: editUser.username,
        name: editUser.name,
        role: editUser.role
      });
      showNotification('success', 'Identity metadata updated');
      setEditUser(null);
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', 'Update operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Commit identity purge? This operation is final.')) return;
    try {
      await remove('users', id);
      showNotification('success', 'Identity purged from registry');
      fetchUsers();
    } catch (err: any) {
      showNotification('error', 'Purge operation failed');
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      (!search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!roleFilter || u.role === roleFilter)
  );

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-sans font-bold uppercase tracking-widest animate-pulse">Initializing User Registry...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">User Control</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                KMU Identity Management & Access Governance
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
              >
                <span>🔑</span> Provision New Identity
              </button>
            </div>
          </div>

          {/* Strategic Metrics Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Identities" value={users.length} color="indigo" />
            <StatCard title="Administrative Units" value={users.filter(u => u.role === 'admin').length} color="purple" />
            <StatCard title="Security Assets" value={users.filter(u => u.role.includes('security')).length} color="blue" />
            <StatCard title="Platform Integrity" value="Live" color="emerald" />
          </div>

          {/* Central Identity Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-indigo-600">Identity Provisioning Ledger</h2>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Query identity metadata..."
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">All Privileges</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4 text-left">Identity Cluster</th>
                    <th className="px-8 py-4 text-left">Privilege Class</th>
                    <th className="px-8 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredUsers.map((u, i) => {
                    const userId = u.id || u._id;
                    const isEditing = editingUserId === userId;
                    return (
                      <tr key={userId} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                              {u.username?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100 uppercase text-xs tracking-tight">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono tracking-tighter mt-0.5">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded border border-indigo-100 dark:border-indigo-900/50">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded">Active</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setEditingUserId(userId); setEditUser({ ...u }); }}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 transition-colors text-sm"
                              title="Modify Identity"
                            >
                              ⚙️
                            </button>
                            <button
                              onClick={() => handleDelete(userId)}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors text-sm"
                              title="Terminate Session"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Identity Provisioning</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Unified Access Governance Entry</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-indigo-600 transition-all">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Identity Username" value={newUser.username} onChange={(v: string) => setNewUser({ ...newUser, username: v })} required />
                <FormField label="Legal Designation" value={newUser.name} onChange={(v: string) => setNewUser({ ...newUser, name: v })} required />
                <FormField label="Security Password" value={newUser.password} onChange={(v: string) => setNewUser({ ...newUser, password: v })} type="password" required />
                <FormField label="Privilege Class" value={newUser.role} onChange={(v: string) => setNewUser({ ...newUser, role: v })} type="select" options={ROLES} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest shadow-sm">
                {loading ? 'Synthesizing...' : 'Commit Identity Provisioning'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={() => cancelEdit()} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Modify Identity</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Metadata Adjustment Protocol</p>
              </div>
              <button onClick={() => cancelEdit()} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-indigo-600 transition-all font-sans">✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Identity Username" value={editUser.username} onChange={(v: string) => setEditUser({ ...editUser, username: v })} required />
                <FormField label="Legal Designation" value={editUser.name} onChange={(v: string) => setEditUser({ ...editUser, name: v })} required />
                <FormField label="Privilege Class" value={editUser.role} onChange={(v: string) => setEditUser({ ...editUser, role: v })} type="select" options={ROLES} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest shadow-sm">
                Update Metadata
              </button>
            </form>
          </div>
        </div>
      )}

      {notification?.isVisible && <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />}
    </div>
  );

  function cancelEdit() {
    setEditingUserId(null);
    setEditUser(null);
  }
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/50',
    purple: 'text-purple-700 bg-purple-50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/50',
    blue: 'text-blue-700 bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/50',
    emerald: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', options = [], required = false }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold uppercase">
          <option value="">Select Privilege...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" />
      )}
    </div>
  );
}