"use client";

import { useState, useEffect } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/constants';
import { authHeaders } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../../components/Notification';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

export default function SecurityReports() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) router.replace('/login');
  }, [authLoading, token, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases || data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchData();
  }, [token]);

  // Distribution by Offense Type
  const offenseCounts: Record<string, number> = {};
  cases.forEach(c => { if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1; });

  const distributionData = {
    labels: Object.keys(offenseCounts),
    datasets: [{
      data: Object.values(offenseCounts),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
      borderWidth: 0,
    }],
  };

  // Trend Data
  const last7Days = [];
  const countsPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    countsPerDay.push(cases.filter(c => new Date(c.createdAt || 0).toDateString() === d.toDateString()).length);
  }

  const trendData = {
    labels: last7Days,
    datasets: [{
      label: 'New Incidents',
      data: countsPerDay,
      borderColor: '#10b981',
      tension: 0.4,
      pointRadius: 2,
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Security Analytics</h1>
            <p className="text-sm text-gray-500">Incident variance and enforcement metrics</p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-8">
                <h3 className="text-sm font-semibold mb-8 text-center">Incident Type Distribution</h3>
                <div className="h-64">
                  <Doughnut
                    data={distributionData}
                    options={{
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 15, font: { size: 10 } } } }
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-8">
                <h3 className="text-sm font-semibold mb-8 text-center">7-Day Incident Trend</h3>
                <div className="h-64">
                  <Line
                    data={trendData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
