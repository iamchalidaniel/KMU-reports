"use client";

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MetricsCardProps {
  label: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'kmuGreen' | 'red' | 'blue' | 'amber' | 'purple';
  onClick?: () => void;
}

export default function MetricsCard({
  label,
  value,
  trend,
  icon,
  color = 'kmuGreen',
  onClick,
}: MetricsCardProps) {
  const colorMap = {
    kmuGreen: 'text-kmuGreen bg-kmuGreen/10 dark:bg-kmuGreen/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
  };

  const trendColorMap = {
    up: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    down: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
  };

  const getTrendIcon = () => {
    if (trend?.direction === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend?.direction === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 ${
        onClick ? 'cursor-pointer hover:shadow-md transition' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        {icon && <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>{icon}</div>}
      </div>

      {trend && (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trendColorMap[trend.direction]}`}>
          {getTrendIcon()}
          <span>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {trend.value}%
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-normal">
            vs {trend.period}
          </span>
        </div>
      )}
    </div>
  );
}
