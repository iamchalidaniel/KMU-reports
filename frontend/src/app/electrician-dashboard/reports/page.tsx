"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Notification, { useNotification } from '../../../components/Notification';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MaintenanceReport {
  _id?: string;
  category: string;
  location: {
    hall: string;
  };
  status: string;
}

const ELECTRICAL_CATEGORIES = [
  { value: 'light', label: 'Lighting' },
  { value: 'socket', label: 'Socket' },
  { value: 'ac', label: 'AC' },
  { value: 'fan', label: 'Fan' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'other', label: 'Other' },
];

export default function ElectricianReports() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [hallFilter, setHallFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/maintenance`, {
          headers: { ...authHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        const electricalReports = (data.reports || data || []).filter((r: MaintenanceReport) =>
          ELECTRICAL_CATEGORIES.some(cat => cat.value === r.category)
        );
        setReports(electricalReports);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchReports();
    }
  }, [token]);

  const analyticsReports = hallFilter
    ? reports.filter(r => r.location.hall === hallFilter)
    : reports;

  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  analyticsReports.forEach(r => {
    if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.status) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const categoryChartData = {
    labels: Object.keys(categoryCounts).map(c => ELECTRICAL_CATEGORIES.find(cat => cat.value === c)?.label || c),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      borderWidth: 0,
    }],
  };

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 0,
    }],
  };

  const halls = Array.from(new Set(reports.map(r => r.location.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-500 space-y-6">

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Maintenance Reports</h1>
            <p className="text-sm text-gray-500">Analytics and distribution of repair tasks</p>

            <div className="mt-8 flex justify-end">
              <select
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                value={hallFilter}
                onChange={(e) => setHallFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6 text-center">
                <h3 className="text-sm font-semibold mb-6">Repairs by Category</h3>
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={categoryChartData}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } }
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6 text-center">
                <h3 className="text-sm font-semibold mb-6">Status Overview</h3>
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={statusChartData}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } }
                    }}
                  />
                </div>
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
