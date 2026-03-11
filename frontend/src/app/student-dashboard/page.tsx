"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { getProfile } from '../../utils/api';
import { useStudentStats } from '../../hooks/useStudentStats';
import Notification, { useNotification } from '../../components/Notification';
import Link from 'next/link';
import {
  Home,
  FileText,
  FolderOpen,
  Scale,
  AlertTriangle,
  Wrench,
  User,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import MetricsCard from '../../components/MetricsCard';
import ActivityTimeline, { Activity } from '../../components/ActivityTimeline';
import Tooltip from '../../components/Tooltip';

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

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const { data: statsData, isLoading: loadingStats } = useStudentStats(user?.studentId || user?.username);
  const reports = statsData?.reports || [];
  const cases = statsData?.cases || [];
  const appeals = statsData?.appeals || [];

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
      if (!user || user.role !== 'student') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    async function fetchFullProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch full profile:', err);
      }
    }
    if (token && user?.role === 'student') {
      fetchFullProfile();
    }
  }, [token, user]);

  if (isCheckingAuth || (authLoading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return <div className="p-12 text-center text-red-600">Access denied.</div>;
  }

  const studentData = profile || user;
  const pendingAppeals = appeals.filter((a: Appeal) => a.status === 'Pending');
  const openCases = cases.filter((c: Case) => c.status === 'Open' || c.status === 'In Progress');
  const needsAttention = pendingAppeals.length > 0 || openCases.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 md:pb-12 text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Needs attention strip */}
          {needsAttention && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">
                  {pendingAppeals.length > 0 && openCases.length > 0
                    ? `You have ${pendingAppeals.length} appeal(s) waiting and ${openCases.length} active case(s)`
                    : pendingAppeals.length > 0
                      ? `You have ${pendingAppeals.length} appeal(s) waiting for review`
                      : `You have ${openCases.length} active case(s)`}
                </span>
              </div>
              <Link
                href="/student-dashboard/records"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:underline"
              >
                See all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Welcome header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-xl bg-kmuGreen flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                {(studentData.name || studentData.username || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {getTimeBasedGreeting()}, {studentData.fullName || studentData.name || 'Student'}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">
                  {studentData.program || '—'} · Year {studentData.yearOfStudy ?? '—'}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  <Link
                    href="/student-dashboard/profile"
                    className="inline-flex items-center gap-2 bg-kmuGreen hover:bg-kmuGreen-dark text-white px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wider transition shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/student-dashboard/records"
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                    My Records
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Overview stats */}
          {loadingStats ? (
            <SkeletonDashboard />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="My Cases"
                value={cases.length}
                color="red"
                path="/student-dashboard/records?tab=cases"
                icon={FolderOpen}
              />
              <StatCard
                title="My Reports"
                value={reports.length}
                color="green"
                path="/student-dashboard/records?tab=statements"
                icon={FileText}
              />
              <StatCard
                title="Waiting"
                value={pendingAppeals.length}
                color="orange"
                path="/student-dashboard/records?tab=appeals"
                icon={Scale}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/student-dashboard/report-incident"
                  className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-kmuGreen/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-kmuGreen transition-colors">
                      Report Issue
                    </div>
                    <div className="text-xs text-gray-500">Tell us what happened</div>
                  </div>
                </Link>
                <Link
                  href="/student-dashboard/request-repair"
                  className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-kmuGreen/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-kmuGreen transition-colors">
                      Request Fix
                    </div>
                    <div className="text-xs text-gray-500">Broken or damaged item</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Status card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    {studentData.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registration</div>
                <div className="font-mono text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {studentData.studentId || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {!loadingStats && (reports.length > 0 || cases.length > 0) && (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Recent Activity</h3>
              <ActivityTimeline
                activities={[
                  ...(reports.slice(0, 2).map((r: Report) => ({
                    id: r._id,
                    type: 'created' as const,
                    title: `Report filed: ${r.offenseType}`,
                    description: r.description?.substring(0, 60) + '...',
                    user: 'You',
                    timestamp: new Date(r.createdAt),
                  }))),
                  ...(cases.slice(0, 2).map((c: Case) => ({
                    id: c._id,
                    type: 'changed' as const,
                    title: `Case status: ${c.status}`,
                    description: `Offense: ${c.offenseType}`,
                    user: 'System',
                    timestamp: new Date(c.createdAt),
                  }))),
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
                isLoading={loadingStats}
              />
            </div>
          )}

          {/* Empty state hint when no activity */}
          {!loadingStats && reports.length === 0 && cases.length === 0 && appeals.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-kmuGreen mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Great news!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You don't have any records yet. If you need to report something or request a fix, use the buttons above.
              </p>
              <Link
                href="/student-dashboard/report-incident"
                className="inline-flex items-center gap-2 bg-kmuGreen text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-kmuGreen-dark transition"
              >
                <AlertTriangle className="w-4 h-4" />
                Report incident
              </Link>
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

function StatCard({
  title,
  value,
  color,
  path,
  icon: Icon,
}: {
  title: string;
  value: number;
  color: string;
  path: string;
  icon: typeof FileText;
}) {
  const colors: Record<string, string> = {
    green: 'border-l-kmuGreen text-kmuGreen',
    red: 'border-l-red-500 dark:border-l-red-400 text-red-600 dark:text-red-400',
    orange: 'border-l-orange-500 dark:border-l-orange-400 text-orange-600 dark:text-orange-400',
  };

  return (
    <Link href={path} className="block h-full">
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all h-full hover:shadow-md hover:scale-[1.01] cursor-pointer ${colors[color] || ''}`}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {title}
        </div>
        <div className="text-xl font-bold tracking-tight tabular-nums">{value}</div>
      </div>
    </Link>
  );
}
