"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAll, register, update, remove } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  Shield,
  UserCheck,
  Activity,
  Settings,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  UserCog,
} from 'lucide-react';

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
      showNotification('success', 'User account created');
      setShowCreate(false);
      setNewUser({ username: '', name: '', password: '', role: 'security_officer' });
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'User creation failed');
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
      showNotification('success', 'User information updated');
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
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await remove('users', id);
      showNotification('success', 'User account deleted');
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
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-kmuGreen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-kmuGreen flex items-center justify-center text-white shrink-0">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">User Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage university user accounts and access roles
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-kmuGreen transition"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Dashboard
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-kmuGreen text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-kmuGreen-dark transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
            </div>
          </div>

          {/* System Overview */}
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Users" value={users.length} color="indigo" icon={Users} />
              <StatCard title="Administrators" value={users.filter(u => u.role === 'admin').length} color="purple" icon={Shield} />
              <StatCard title="Security Staff" value={users.filter(u => u.role?.includes('security')).length} color="blue" icon={UserCheck} />
            </div>
          )}

          {/* User List */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">User List</h2>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-80">
                    <input
                      placeholder="Search users..."
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-kmuGreen transition-all outline-none"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                  >
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4 text-left">User Details</th>
                    <th className="px-8 py-4 text-left">Role</th>
                    <th className="px-8 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && users.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                        <td className="px-8 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                        <td className="px-8 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto" /></td>
                        <td className="px-8 py-4"><div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredUsers.map((u, i) => {
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
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-kmuGreen hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              title="Edit User"
                              aria-label="Edit user"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(userId)}
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                              title="Delete User"
                              aria-label="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Users className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No users match your filters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {search || roleFilter ? 'Try adjusting search or role filter.' : 'Create a user to get started.'}
                </p>
                {search || roleFilter ? (
                  <button
                    onClick={() => { setSearch(''); setRoleFilter(''); }}
                    className="text-sm font-medium text-kmuGreen hover:underline"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 bg-kmuGreen text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-kmuGreen-dark transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create user
                  </button>
                )}
              </div>
            )}
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Create New User</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enter details to create a new user account</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Username" value={newUser.username} onChange={(v: string) => setNewUser({ ...newUser, username: v })} required />
                <FormField label="Full Name" value={newUser.name} onChange={(v: string) => setNewUser({ ...newUser, name: v })} required />
                <FormField label="Password" value={newUser.password} onChange={(v: string) => setNewUser({ ...newUser, password: v })} type="password" required />
                <FormField label="Account Role" value={newUser.role} onChange={(v: string) => setNewUser({ ...newUser, role: v })} type="select" options={ROLES} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-kmuGreen text-white font-bold py-3.5 rounded-lg hover:bg-kmuGreen-dark transition-all text-sm font-medium shadow-sm flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating...' : 'Create User Account'}
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Edit User Details</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Update user profile information</p>
              </div>
              <button type="button" onClick={() => cancelEdit()} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Username" value={editUser.username} onChange={(v: string) => setEditUser({ ...editUser, username: v })} required />
                <FormField label="Full Name" value={editUser.name} onChange={(v: string) => setEditUser({ ...editUser, name: v })} required />
                <FormField label="Account Role" value={editUser.role} onChange={(v: string) => setEditUser({ ...editUser, role: v })} type="select" options={ROLES} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-kmuGreen text-white font-bold py-3.5 rounded-lg hover:bg-kmuGreen-dark transition-all text-sm font-medium shadow-sm flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update User Information
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

function StatCard({ title, value, color, icon: Icon }: { title: string; value: string | number; color: string; icon?: React.ComponentType<{ className?: string }> }) {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/50',
    purple: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/50',
    blue: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/50',
    emerald: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-6 transition-all duration-300 ${colors[color] || ''}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        {title}
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', options = [], required = false }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-kmuGreen outline-none transition-all text-sm font-bold uppercase">
          <option value="">Select Role...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-kmuGreen outline-none transition-all text-sm font-bold" />
      )}
    </div>
  );
}