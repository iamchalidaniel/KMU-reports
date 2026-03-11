"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { useRouter } from 'next/navigation';
import { Loader2, Filter } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';
import { SkeletonTable } from '../../../components/SkeletonLoader';
import EmptyState from '../../../components/EmptyState';
import StatusBadge from '../../../components/StatusBadge';
import SearchBar from '../../../components/SearchBar';

interface AuditLog {
  _id: string;
  admin: string;
  action: string;
  changes: string;
  timestamp: string;
  entity: string;
  role: string;
}

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'dean_of_students') return;

    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/audit-logs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [user]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  if (authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'dean_of_students') {
    return <div className="p-12 text-center text-red-600">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/dean-of-students-dashboard' },
          { label: 'Audit Logs' }
        ]} />

        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track all system actions and changes</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <SearchBar
                onSearch={setSearchTerm}
                placeholder="Search by action, admin, or entity..."
              />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <SkeletonTable />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No audit logs found"
              description="No matching audit log entries found. Try adjusting your search filters."
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Entity</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Changes</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{log.admin}</td>
                        <td className="px-6 py-4 text-sm">
                          <StatusBadge status={log.action.toLowerCase()} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{log.entity}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.changes}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 font-sans p-2">
                  {filteredLogs.map((log) => (
                    <div key={log._id} className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg mb-2 shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold uppercase text-xs">
                            {log.admin.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">{log.admin}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{new Date(log.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                        <StatusBadge status={log.action.toLowerCase()} />
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1 opacity-70">Entity / Resource</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-3">{log.entity}</div>
                        
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1 opacity-70">Changes</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700 break-words line-clamp-3">
                          {log.changes}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
