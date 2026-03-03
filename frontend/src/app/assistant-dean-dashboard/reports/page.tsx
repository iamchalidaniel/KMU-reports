"use client";

import { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { fetchWithAuth, authHeaders } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AssistantDeanReports() {
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
        const casesData = await fetchWithAuth(`${API_BASE_URL}/cases`);
        setCases(Array.isArray(casesData) ? casesData : (casesData.cases || casesData || []));
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

  const statusCounts: Record<string, number> = {};
  const offenseCounts: Record<string, number> = {};

  analyticsCases.forEach((c: any) => {
    if (c.status) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
  });

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#3B82F6', '#FBBF24', '#22C55E', '#A855F7'],
      borderWidth: 0,
    }],
  };

  const topOffences = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const offenseChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Offenses',
      data: topOffences.map(([, count]) => count),
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
            <h1 className="text-2xl font-bold tracking-tight mb-2">Academic Reports</h1>
            <p className="text-sm text-gray-500">Institutional analytics and trends</p>

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
                <h3 className="text-sm font-semibold mb-6 text-center">Case Status Distribution</h3>
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

              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold mb-6 text-center">Top Offenses</h3>
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
