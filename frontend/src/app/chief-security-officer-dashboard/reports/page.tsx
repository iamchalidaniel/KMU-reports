"use client";

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CSOReports() {
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

  const filteredCases = programFilter
    ? cases.filter((c: any) => c.student?.program === programFilter)
    : cases;

  const offenseCounts: Record<string, number> = {};
  filteredCases.forEach((c: any) => {
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
  });

  const topOffences = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const offenseChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Security Incidents',
      data: topOffences.map(([, count]) => count),
      backgroundColor: 'rgba(220, 38, 38, 0.7)',
      borderRadius: 12,
    }],
  };

  const programs = Array.from(new Set(cases.map((c: any) => c.student?.program).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Security Analytics</h1>
            <p className="text-sm text-gray-500">In-depth security incident distribution and strategy</p>

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

            <div className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800 p-8">
                <h3 className="text-sm font-semibold mb-8 text-center uppercase tracking-widest text-red-600">Incident Type Variance</h3>
                <div className="h-80 flex items-center justify-center">
                  <Bar
                    data={offenseChartData}
                    options={{
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        y: { grid: { display: false } }
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
