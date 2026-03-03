"use client";

import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function SecretaryReports() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('');

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

  const analyticsCases = programFilter
    ? cases.filter((c: any) => c.student?.program === programFilter)
    : cases;

  // Trend Data
  const last7Days = [];
  const casesPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    casesPerDay.push(analyticsCases.filter(c => new Date(c.createdAt || 0).toDateString() === d.toDateString()).length);
  }

  const trendData = {
    labels: last7Days,
    datasets: [{
      label: 'New Cases',
      data: casesPerDay,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Offense Counts
  const offenseCounts: Record<string, number> = {};
  analyticsCases.forEach((c: any) => {
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
  });

  const topOffenses = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const offenseChartData = {
    labels: topOffenses.map(([offence]) => offence),
    datasets: [{
      label: 'Offenses',
      data: topOffenses.map(([, count]) => count),
      backgroundColor: '#10B981',
      borderRadius: 8,
    }],
  };

  const programs = Array.from(new Set(cases.map((c: any) => c.student?.program).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Administrative Analytics</h1>
            <p className="text-sm text-gray-500">Resource and case trend reporting</p>

            <div className="mt-8 flex justify-end">
              <select
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <option value="">All Programs</option>
                {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold mb-6 text-center">7-Day Case Trend</h3>
                <div className="h-64 flex items-center justify-center">
                  <Line
                    data={trendData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold mb-6 text-center">Top Category Offenses</h3>
                <div className="h-64 flex items-center justify-center">
                  <Bar
                    data={offenseChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
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

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
    </div>
  );
}
