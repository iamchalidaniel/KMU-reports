"use client";

import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function HallWardenReports() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hallFilter, setHallFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !token) router.replace('/login');
  }, [authLoading, token, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } });
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchData();
  }, [token]);

  const filteredReports = hallFilter
    ? reports.filter((r: any) => r.location.hall?.toLowerCase().includes(hallFilter.toLowerCase()))
    : reports;

  const categoryCounts: Record<string, number> = {};
  filteredReports.forEach(r => { if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1; });

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
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Maintenance Analytics</h1>
            <p className="text-sm text-gray-500">Infrastructure failure metrics and hall variance</p>

            <div className="mt-8 flex justify-end">
              <select
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                value={hallFilter}
                onChange={(e) => setHallFilter(e.target.value)}
              >
                <option value="">All Halls</option>
                {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-8 w-full max-w-2xl">
                <h3 className="text-sm font-semibold mb-8 text-center uppercase tracking-widest text-emerald-600">Fault Distribution</h3>
                <div className="h-80">
                  <Doughnut
                    data={categoryChartData}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 20, font: { size: 10, weight: 'bold' } } } }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-sm font-semibold mb-6">Severity Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Urgent', 'High', 'Medium', 'Low'].map(p => {
                  const count = reports.filter(r => r.priority === p).length;
                  return (
                    <div key={p} className="bg-gray-50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{p} Priority</div>
                      <div className="text-xl font-bold">{count} dispatches</div>
                    </div>
                  );
                })}
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
