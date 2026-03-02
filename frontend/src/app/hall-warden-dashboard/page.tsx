"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../components/Notification';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MaintenanceReport {
  _id?: string;
  id?: string;
  category: string;
  location: {
    hall: string;
    room?: string;
    floor?: string;
    building?: string;
  };
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Reported' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  reported_by: {
    student_id?: string;
    staff_id?: string;
    name: string;
    contact?: string;
  };
  assigned_to?: {
    staff_id?: string;
    name?: string;
    role?: string;
  };
  created_at: string;
}

const CATEGORIES = [
  { value: 'fridge', label: 'Refrigerator' },
  { value: 'light', label: 'Lighting' },
  { value: 'socket', label: 'Electrical Socket' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'door', label: 'Door' },
  { value: 'window', label: 'Window' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'fan', label: 'Fan' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'Reported', label: 'Reported' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function HallWardenDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');
  const [electricians, setElectricians] = useState<any[]>([]);
  const [assigningReportId, setAssigningReportId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    hall: '',
    room: '',
    floor: '',
    building: '',
    description: '',
    priority: 'Medium',
    reported_by_name: '',
    reported_by_contact: '',
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
      if (!user || user.role !== 'hall_warden') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
    fetchElectricians();
  }, []);

  async function fetchElectricians() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        const electricianUsers = (data.users || data || []).filter((u: any) => u.role === 'electrician');
        setElectricians(electricianUsers);
      }
    } catch (err) {
      console.error('Failed to fetch electricians:', err);
    }
  }

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/analytics`, { headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }

  useEffect(() => {
    let filtered = [...reports];
    if (search) {
      filtered = filtered.filter(r =>
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.location.room?.toLowerCase().includes(search.toLowerCase()) ||
        r.reported_by.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.location.hall?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
    if (priorityFilter) filtered = filtered.filter(r => r.priority === priorityFilter);
    if (hallFilter) filtered = filtered.filter(r => r.location.hall?.toLowerCase().includes(hallFilter.toLowerCase()));

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredReports(filtered);
  }, [search, statusFilter, priorityFilter, hallFilter, reports]);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reported_by: { name: formData.reported_by_name, contact: formData.reported_by_contact },
          location: { hall: formData.hall, room: formData.room, floor: formData.floor, building: formData.building },
          status: 'Reported',
        }),
      });

      if (res.ok) {
        showNotification('success', 'Maintenance report submitted');
        setShowForm(false);
        setFormData({
          category: '', hall: '', room: '', floor: '', building: '',
          description: '', priority: 'Medium', reported_by_name: '', reported_by_contact: '',
        });
        fetchReports();
        fetchAnalytics();
      }
    } catch (err) {
      showNotification('error', 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(reportId: string, newStatus: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification('success', 'Status updated successfully');
        fetchReports();
        fetchAnalytics();
      }
    } catch (err) {
      showNotification('error', 'Failed to update status');
    }
  }

  async function assignToElectrician(reportId: string, electricianId: string, electricianName: string) {
    try {
      setAssigningReportId(reportId);
      const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Assigned',
          assigned_to: { staff_id: electricianId, name: electricianName, role: 'electrician' }
        }),
      });
      if (res.ok) {
        showNotification('success', 'Assigned to technician');
        fetchReports();
        fetchAnalytics();
      }
    } catch (err) {
      showNotification('error', 'Failed to assign technician');
    } finally {
      setAssigningReportId(null);
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading Profile...</div>;
  }

  if (!user || user.role !== 'hall_warden') {
    return <div className="text-red-600 p-12 text-center">Access denied.</div>;
  }

  const categoryCounts: Record<string, number> = {};
  reports.forEach(r => { if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1; });
  const categoryChartData = {
    labels: Object.keys(categoryCounts).map(c => c.toUpperCase()),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#4b5563'],
      borderWidth: 0,
    }],
  };

  const halls = Array.from(new Set(reports.map(r => r.location.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Hall Warden Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Hall Warden Dashboard</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1 text-kmuGreen uppercase tracking-wider">Manage hostel maintenance and student facilities</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-kmuGreen hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
              >
                🛠️ Report Maintenance Issue
              </button>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Reports" value={reports.length} color="teal" />
            <StatCard title="Pending Reports" value={reports.filter(r => r.status === 'Reported').length} color="orange" />
            <StatCard title="In Progress" value={reports.filter(r => r.status === 'In Progress' || r.status === 'Assigned').length} color="blue" />
            <StatCard title="Completed Reports" value={reports.filter(r => r.status === 'Completed').length} color="emerald" />
          </div>

          {/* Analytics Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Infrastructural Fault Variance</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-kmuGreen transition-all font-sans"
                  value={hallFilter}
                  onChange={(e) => setHallFilter(e.target.value)}
                >
                  <option value="">All Halls</option>
                  {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={categoryChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 8, font: { family: 'sans-serif', size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Issue Priority</h3>
              <div className="space-y-4 font-sans">
                {['Urgent', 'High', 'Medium', 'Low'].map(p => {
                  const count = reports.filter(r => r.priority === p).length;
                  const percentage = reports.length ? (count / reports.length) * 100 : 0;
                  return (
                    <div key={p} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className={p === 'Urgent' ? 'text-red-500' : 'text-gray-500'}>{p} Level</span>
                        <span className="font-bold">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${p === 'Urgent' ? 'bg-red-500' : p === 'High' ? 'bg-orange-500' : 'bg-kmuGreen'}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Maintenance Reports */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold uppercase tracking-tight text-kmuGreen">Recent Maintenance Reports</h2>
              <div className="relative w-full md:w-80 font-sans">
                <input
                  placeholder="Search reports..."
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs w-full focus:ring-2 focus:ring-kmuGreen transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Location / Reported By</th>
                    <th className="px-6 py-4 text-left">Category / Details</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredReports.slice(0, 15).map((report, i) => {
                    const reportId = report._id || report.id;
                    return (
                      <tr key={reportId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-gray-100 uppercase">{report.location.hall}</div>
                          <div className="text-[10px] text-gray-400 font-semibold italic mt-0.5">Unit {report.location.room || 'N/A'} • {getRelativeTime(report.created_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">{report.category}</div>
                          <div className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">"{report.description}"</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={report.status}
                            onChange={(e) => updateStatus(reportId!, e.target.value)}
                            className={`text-[10px] font-bold uppercase bg-transparent outline-none cursor-pointer border-b border-transparent hover:border-kmuGreen transition-all ${report.status === 'Completed' ? 'text-emerald-600' : 'text-blue-600'}`}
                          >
                            {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-white dark:bg-gray-900">{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {['light', 'socket', 'ac', 'fan', 'fridge'].includes(report.category) && report.status === 'Reported' ? (
                            <select
                              className="text-[10px] font-bold uppercase bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-kmuGreen transition-all"
                              onChange={(e) => {
                                const elec = electricians.find(el => el._id === e.target.value);
                                if (elec) assignToElectrician(reportId!, elec._id, elec.name);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Dispatch Tech</option>
                              {electricians.map(el => <option key={el._id} value={el._id}>{el.name}</option>)}
                            </select>
                          ) : report.assigned_to?.name ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Technician Assigned</span>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">{report.assigned_to.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 italic uppercase font-semibold">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="text-center py-20 text-gray-400 italic text-sm">No maintenance reports found.</div>
              )}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/20 text-center border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End of list</span>
            </div>
          </div>
        </div>
      </div>

      {/* Initiation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Report Maintenance Issue</h2>
                <p className="text-xs text-kmuGreen font-bold uppercase tracking-wider mt-1">Enter details of the maintenance issue</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-all font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Category" value={formData.category} onChange={(v: string) => setFormData({ ...formData, category: v })} type="select" options={CATEGORIES} />
                <FormField label="Priority" value={formData.priority} onChange={(v: string) => setFormData({ ...formData, priority: v })} type="select" options={PRIORITIES} />
                <FormField label="Hall/Hostel" value={formData.hall} onChange={(v: string) => setFormData({ ...formData, hall: v })} />
                <FormField label="Room Number" value={formData.room} onChange={(v: string) => setFormData({ ...formData, room: v })} />
                <div className="md:col-span-2">
                  <FormField label="Description" value={formData.description} onChange={(v: string) => setFormData({ ...formData, description: v })} type="textarea" />
                </div>
                <FormField label="Reported By (Name)" value={formData.reported_by_name} onChange={(v: string) => setFormData({ ...formData, reported_by_name: v })} />
                <FormField label="Contact Information" value={formData.reported_by_contact} onChange={(v: string) => setFormData({ ...formData, reported_by_contact: v })} />
              </div>
              <div className="mt-8 flex gap-4">
                <button type="submit" disabled={loading} className="flex-1 bg-kmuGreen hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-xs uppercase tracking-widest">
                  {loading ? 'Submitting...' : 'Submit Maintenance Report'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    teal: 'border-emerald-500 dark:border-emerald-400',
    orange: 'border-orange-500 dark:border-orange-400',
    blue: 'border-blue-500 dark:border-blue-400',
    emerald: 'border-green-500 dark:border-green-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color]}`}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', options = [] }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuGreen outline-none transition-all text-xs font-bold uppercase">
          <option value="">Select Category/Priority...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuGreen outline-none min-h-[120px] transition-all text-xs font-medium" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-kmuGreen outline-none transition-all text-xs font-bold" />
      )}
    </div>
  );
}
