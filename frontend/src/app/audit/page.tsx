"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from "next/navigation";
import Notification, { useNotification } from '../../components/Notification';

interface AuditLog {
  _id?: string;
  action: string;
  entity?: string;
  entityId?: string;
  user?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  date?: string;
  createdAt?: string;
}

export default function AuditPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  const limit = 20;

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
      if (!user || !['admin', 'chief_security_officer', 'dean_of_students'].includes(user.role)) {
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

    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/audit?page=${page}&limit=${limit}`, {
          headers: { ...authHeaders() },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setStats(data.stats || {});
      } catch (err) {
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }

    if (token && user && ['admin', 'chief_security_officer', 'dean_of_students'].includes(user.role)) {
      fetchStaffProfile();
      fetchLogs();
    }
  }, [token, user, page]);

  useEffect(() => {
    if (!user || !['admin', 'chief_security_officer', 'dean_of_students'].includes(user.role)) return;
    if (!socketRef.current && API_BASE_URL) {
      const socket = io(API_BASE_URL.replace('/api', ''), { transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('joinAdmin');
      });
      socket.on('audit:new', (log: any) => {
        setLogs((prev) => [log, ...prev]);
        setTotal(t => t + 1);
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || !['admin', 'chief_security_officer', 'dean_of_students'].includes(user.role)) {
    return <div className="text-red-600 p-12">Access denied. Audit access restricted.</div>;
  }

  const staffData = profile || user;

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600 bg-red-50';
    if (action.includes('create')) return 'text-green-600 bg-green-50';
    if (action.includes('update')) return 'text-blue-600 bg-blue-50';
    if (action.includes('login')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Banner Area */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-gray-800 to-indigo-900 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'System Auditor'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Role : <span className="text-indigo-600 dark:text-indigo-400 font-mono">GOVERNANCE & AUDIT</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="System Logs" icon="📜" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <NavButton label="Quick Stats" icon="📊" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                <NavButton label="My Profile" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
              </nav>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'logs' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold">Comprehensive System Audit</h2>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time monitoring active</div>
                  </div>

                  <div className="space-y-4">
                    {logs.map((log, i) => (
                      <div key={log._id || i} className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-sm">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getActionColor(log.action)}`}>
                              {log.action.replace('_', ' ')}
                            </span>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{log.entity || 'System Event'}</h3>
                          </div>
                          <div className="text-[10px] font-mono text-gray-400">{new Date(log.date || log.createdAt || '').toLocaleString()}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
                          <div>
                            <label className="block text-gray-400 uppercase font-bold mb-1">Initiator</label>
                            <span className="font-bold text-indigo-600 underline cursor-pointer">{log.user || 'SYSTEM'}</span>
                          </div>
                          <div>
                            <label className="block text-gray-400 uppercase font-bold mb-1">Source IP</label>
                            <span className="font-mono">{log.ipAddress || '127.0.0.1'}</span>
                          </div>
                          <div className="md:text-right">
                            <label className="block text-gray-400 uppercase font-bold mb-1">Identifier</label>
                            <span className="font-mono text-gray-500">{log.entityId || '-'}</span>
                          </div>
                        </div>

                        {log.details && (
                          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 hidden group-hover:block animate-in slide-in-from-top-2 duration-300">
                            <pre className="text-[10px] bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-gray-600 dark:text-gray-400">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-50 dark:border-gray-700">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-xs disabled:opacity-30"
                    >PREVIOUS</button>
                    <span className="text-xs font-bold text-gray-400">PAGE {page} OF {Math.ceil(total / limit) || 1}</span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * limit >= total}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-xs disabled:opacity-30"
                    >NEXT PAGE</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard title="Total Registry Entries" value={total} color="indigo" />
                  <StatCard title="Security Events" value={stats.case_created || 0} color="red" />
                  <StatCard title="Logins" value={stats.user_login || 0} color="teal" />
                  <StatCard title="Denied Access" value={stats.login_failed || 0} color="orange" />
                  <StatCard title="Data Mutated" value={(stats.case_updated || 0) + (stats.status_change || 0)} color="blue" />
                  <StatCard title="Deletions" value={stats.case_deleted || 0} color="red" />
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 animate-in fade-in duration-300">
                <div className="space-y-10">
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Auditor Credentials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Staff ID" value={staffData.staffId || staffData.username} />
                      <InfoField label="Primary Role" value={staffData.role?.toUpperCase().replace('_', ' ')} />
                      <InfoField label="Status" value="PROVISIONED" />
                    </div>
                  </section>
                </div>
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
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600'
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
    indigo: 'text-indigo-600 border-indigo-100',
    red: 'text-red-600 border-red-100',
    teal: 'text-teal-600 border-teal-100',
    orange: 'text-orange-600 border-orange-100',
    blue: 'text-blue-600 border-blue-100'
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
      <label className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}