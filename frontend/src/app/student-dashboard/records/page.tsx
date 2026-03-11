"use client";

import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import Notification, { useNotification } from '../../../components/Notification';
import Link from 'next/link';
import {
  FileText,
  FolderOpen,
  Scale,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
import { SkeletonTable } from '../../../components/SkeletonLoader';
import Breadcrumb from '../../../components/Breadcrumb';

interface Report {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Case {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  sanctions?: string;
  createdAt: string;
}

interface Appeal {
  _id: string;
  reportId: string;
  reason: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const TABS = [
  { id: 'statements', label: 'Statements', icon: FileText },
  { id: 'cases', label: 'Cases', icon: FolderOpen },
  { id: 'appeals', label: 'Appeals', icon: Scale },
] as const;

type TabId = (typeof TABS)[number]['id'];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RecordsContent() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') || 'statements') as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === tabParam) ? tabParam : 'statements'
  );
  const { notification, hideNotification } = useNotification();

  const [reports, setReports] = useState<Report[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = searchParams.get('tab') as TabId;
    if (t && TABS.some((x) => x.id === t)) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'student') {
      router.replace('/');
      return;
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    if (!user?.studentId) return;
    async function fetchAll() {
      setLoading(true);
      try {
        const [reportsRes, casesRes, appealsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/student-reports`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/cases?studentId=${user?.studentId}`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, { headers: { ...authHeaders() } }),
        ]);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data.reports || []);
        }
        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(Array.isArray(data) ? data : data.cases || []);
        }
        if (appealsRes.ok) {
          const data = await appealsRes.json();
          setAppeals(data.appeals || []);
        }
      } catch (err) {
        console.error('Failed to fetch records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [user?.studentId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-kmuGreen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/student-dashboard' }, { label: 'Records' }]} />
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-kmuGreen" />
                My Records
              </h1>
              <p className="text-sm text-gray-500 mt-1">Statements, cases, and appeals in one place</p>
            </div>
            <Link
              href="/student-dashboard"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Back to Dashboard
              <ChevronRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/student-dashboard/records?tab=${tab.id}`, { scroll: false });
                  }}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-kmuGreen text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {loading ? (
            <SkeletonTable />
          ) : activeTab === 'statements' ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Incident Date</th>
                      <th className="px-6 py-4 text-left">Offense Category</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {reports.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">{formatDate(r.incidentDate)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{r.offenseType}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reports.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="No statements yet"
                  description="Your submitted incident statements will appear here."
                />
              )}
            </div>
          ) : activeTab === 'cases' ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Offense</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cases.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">{formatDate(c.incidentDate)}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{c.offenseType}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/cases/${c._id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-kmuGreen hover:underline"
                          >
                            View details
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cases.length === 0 && (
                <EmptyState
                  icon={FolderOpen}
                  title="No disciplinary cases"
                  description="You have no disciplinary cases on record."
                />
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="space-y-4">
                {appeals.map((appeal) => (
                  <div
                    key={appeal._id}
                    className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-kmuGreen/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                          Appeal ref: {appeal._id.substring(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1">Submitted: {formatDate(appeal.createdAt)}</p>
                      </div>
                      <StatusBadge status={appeal.status} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">&quot;{appeal.reason}&quot;</p>
                    {appeal.adminResponse && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-kmuGreen uppercase mb-1.5 tracking-wider">Response</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{appeal.adminResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {appeals.length === 0 && (
                <EmptyState
                  icon={Scale}
                  title="No appeals"
                  description="Appeals you submit for disciplinary decisions will appear here."
                />
              )}
            </div>
          )}
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



export default function StudentRecordsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh] text-kmuGreen">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      }
    >
      <RecordsContent />
    </Suspense>
  );
}
