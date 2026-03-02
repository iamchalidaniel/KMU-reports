"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { OFFENSE_TYPES, SEVERITY_LEVELS } from '../../config/constants';
import Notification, { useNotification } from '../../components/Notification';
import AIAssistant from '../../components/AIAssistant';

interface Report {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  appealStatus?: string;
  appealReason?: string;
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

  // Authentication checks
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'academics' | 'appeals' | 'password'>('info');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

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

  // Fetch Full Profile including student data
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

  // Fetch student's reports
  useEffect(() => {
    if (user?.studentId) {
      fetchReports();
    }
  }, [user?.studentId, page, statusFilter, search]);

  // Fetch appeals
  useEffect(() => {
    if (user?.studentId && activeTab === 'appeals') {
      fetchAppeals();
    }
  }, [user?.studentId, activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/api/student-reports?${params}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      showNotification('error', 'Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAppeals(data.appeals || []);
    } catch (err: any) {
      console.error('Failed to fetch appeals:', err);
      showNotification('error', 'Failed to load appeals');
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'closed':
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in appeal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'appeal rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-kmuGreen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kmuGreen"></div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg m-4">Access denied. This page is for students only.</div>;
  }

  const studentData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Dashboard Header / Banner area */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                  {studentData.name ? studentData.name.charAt(0).toUpperCase() : studentData.username.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{studentData.name || 'Student Name'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Student ID : <span className="text-blue-600 dark:text-blue-400 font-mono">{studentData.studentId}</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Your Info" icon="👥" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Academics" icon="📖" active={activeTab === 'academics'} onClick={() => setActiveTab('academics')} />
                <NavButton label="Appeals" icon="⚖️" active={activeTab === 'appeals'} onClick={() => setActiveTab('appeals')} />
                <NavButton label="Change Password" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 min-h-[500px]">

              {activeTab === 'info' && <PersonalInfoView studentData={studentData} />}

              {activeTab === 'academics' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-kmuGreen">Academic Reports</h2>
                    <span className="text-sm font-medium text-gray-500">Total: {total}</span>
                  </div>
                  <ReportsTable reports={reports} formatDate={formatDate} getStatusColor={getStatusColor} loading={loadingReports} />
                </div>
              )}

              {activeTab === 'appeals' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-kmuGreen mb-6">My Appeals</h2>
                  <AppealsList appeals={appeals} formatDate={formatDate} getStatusColor={getStatusColor} />
                </div>
              )}

              {activeTab === 'password' && <ChangePasswordView showNotification={showNotification} />}
            </div>
          </div>
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
      <AIAssistant formType="appeal" />
    </div>
  );
}

// Sub-components for cleaner structure
function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-kmuOrange bg-orange-50 dark:bg-orange-900/10 text-kmuOrange'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function PersonalInfoView({ studentData }: any) {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <section>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Student ID" value={studentData.studentId} />
          <InfoField label="Program" value={studentData.program} fullWidth />
          <InfoField label="Year" value={studentData.year || '2026'} />
          <InfoField label="Year of Study" value={studentData.yearOfStudy || '4'} />
          <InfoField label="Status" value={studentData.status || 'REGISTERED'} />
          <InfoField label="Delivery Mode" value={studentData.deliveryMode || 'FULLTIME'} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Personal Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="First Name" value={studentData.firstName || studentData.name?.split(' ')[1] || 'DANIEL'} />
          <InfoField label="Sur Name" value={studentData.surName || studentData.name?.split(' ')[0] || 'CHALI'} />
          <InfoField label="NRC" value={studentData.nrc || '310820/46/1'} />
          <InfoField label="Passport" value={studentData.passport || ''} />
          <InfoField label="Marital Status" value={studentData.maritalStatus || 'SINGLE'} />
          <InfoField label="Nationality" value={studentData.nationality || 'zambian'} />
          <InfoField label="Gender" value={studentData.gender || 'MALE'} />
          <InfoField label="Date of birth" value={studentData.dateOfBirth || '2004-04-23'} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Accomodation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Room Number" value={studentData.roomNo || 'Z407'} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Province" value={studentData.province || 'MUCHINGA'} />
          <InfoField label="Town" value={studentData.town || 'CHINSALI'} />
          <InfoField label="Address" value={studentData.address || 'CHOSHI'} />
          <InfoField label="Phone" value={studentData.phone || '0772273500'} />
          <InfoField label="Email" value={studentData.email} />
        </div>
      </section>

      <div className="text-center pt-8 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-500 font-medium italic">Apanel Version 1.9.85</p>
      </div>
    </div>
  );
}

function InfoField({ label, value, fullWidth = false }: any) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}

function ReportsTable({ reports, formatDate, getStatusColor, loading }: any) {
  if (loading) return <div className="text-center py-10 italic text-gray-500">Loading reports...</div>;
  if (reports.length === 0) return <div className="text-center py-10 italic text-gray-500">No reports found.</div>;

  return (
    <div className="overflow-x-auto border rounded-xl border-gray-100 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
          <tr>
            <th className="px-5 py-4 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wider">Date</th>
            <th className="px-5 py-4 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wider">Type</th>
            <th className="px-5 py-4 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {reports.map((r: any) => (
            <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-5 py-4">{formatDate(r.incidentDate)}</td>
              <td className="px-5 py-4 font-semibold">{r.offenseType}</td>
              <td className="px-5 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(r.status)}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppealsList({ appeals, formatDate, getStatusColor }: any) {
  if (appeals.length === 0) return <div className="text-center py-10 italic text-gray-500 border rounded-xl border-gray-100 dark:border-gray-800">No appeals submitted yet.</div>;

  return (
    <div className="space-y-4">
      {appeals.map((appeal: any) => (
        <div key={appeal._id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-kmuOrange/30 transition-colors bg-white/50 dark:bg-gray-800/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Appeal for Report #{appeal.reportId?.substring(0, 8)}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submitted: {formatDate(appeal.createdAt)}</p>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(appeal.status)}`}>
              {appeal.status}
            </span>
          </div>
          <div className="text-sm border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
            <p className="font-bold text-blue-800 dark:text-blue-400 text-[10px] uppercase mb-1">Reason:</p>
            <p className="text-gray-700 dark:text-gray-300">{appeal.reason}</p>
          </div>
          {appeal.adminResponse && (
            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mt-4 border border-gray-100 dark:border-gray-700">
              <p className="font-bold text-kmuGreen text-[10px] uppercase mb-1">Admin Response:</p>
              <p className="text-gray-700 dark:text-gray-300">{appeal.adminResponse}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChangePasswordView({ showNotification }: any) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update password");
      }

      showNotification('success', 'Password updated successfully');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showNotification('error', err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-300 py-8">
      <h2 className="text-2xl font-bold text-kmuGreen mb-8 text-center">Change Your Password</h2>
      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter ml-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuOrange outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter ml-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuOrange outline-none transition-all"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter ml-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuOrange outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg transform active:scale-[0.98] uppercase tracking-wider ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
