"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import Notification, { useNotification } from '../../components/Notification';
import Link from 'next/link';

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

export default function StudentDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

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

  useEffect(() => {
    if (user?.studentId) {
      fetchStats();
    }
  }, [user?.studentId]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [reportsRes, casesRes, appealsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student-reports`, { headers: { ...authHeaders() } }),
        fetch(`${API_BASE_URL}/cases?studentId=${user?.studentId}`, { headers: { ...authHeaders() } }),
        fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, { headers: { ...authHeaders() } })
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(Array.isArray(data) ? data : (data.cases || []));
      }
      if (appealsRes.ok) {
        const data = await appealsRes.json();
        setAppeals(data.appeals || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isCheckingAuth || (authLoading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kmuGreen"></div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return <div className="p-12 text-center text-red-600">Access denied.</div>;
  }

  const studentData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Student Welcome Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-xl bg-kmuGreen flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {studentData.name ? studentData.name.charAt(0).toUpperCase() : studentData.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome, {studentData.fullName || studentData.name || 'Student'}</h1>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">{studentData.program} • Year {studentData.yearOfStudy}</p>

                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  <Link href="/student-dashboard/profile" className="bg-kmuGreen hover:bg-kmuGreen-dark text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition shadow-sm">
                    Profile
                  </Link>
                  <Link href="/student-dashboard/statements" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
                    My Statements
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Cases" value={cases.length} color="red" path="/student-dashboard/cases" />
            <StatCard title="Statements" value={reports.length} color="green" path="/student-dashboard/statements" />
            <StatCard title="Appeals" value={appeals.filter(a => a.status === 'Pending').length} color="orange" path="/student-dashboard/appeals" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/student-dashboard/report-incident" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">🚨</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-kmuGreen">Report Incident</div>
                    <div className="text-[10px] text-gray-500">Log a security matter</div>
                  </div>
                </Link>
                <Link href="/student-dashboard/request-repair" className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">🛠️</div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight group-hover:text-kmuGreen">Request Repair</div>
                    <div className="text-[10px] text-gray-500">Maintenance & Facilities</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-xl font-black text-gray-900 dark:text-white tracking-widest uppercase">{studentData.status || 'ACTIVE'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registration</div>
                <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{studentData.studentId}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
    </div>
  );
}

function StatCard({ title, value, color, path, isStatus }: any) {
  const colors: any = {
    green: 'border-kmuGreen dark:border-kmuGreen-light text-kmuGreen',
    red: 'border-red-500 dark:border-red-400 text-red-600',
    orange: 'border-orange-500 dark:border-orange-400 text-orange-600',
    emerald: 'border-emerald-500 dark:border-emerald-400 text-emerald-600'
  };

  const CardContent = (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-5 transition-all h-full ${path ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer' : ''} ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</div>
      <div className={`text-xl font-bold tracking-tight ${isStatus ? 'truncate' : ''}`}>
        {value}
      </div>
    </div>
  );

  return path ? <Link href={path}>{CardContent}</Link> : CardContent;
}
