"use client";

import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  // Case statuses
  'approved': { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2, label: 'Approved' },
  'rejected': { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', icon: XCircle, label: 'Rejected' },
  'pending': { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', icon: Clock, label: 'Pending' },
  'in_review': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: Eye, label: 'In Review' },
  'dismissed': { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-300', icon: Trash2, label: 'Dismissed' },
  'resolved': { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2, label: 'Resolved' },
  'completed': { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2, label: 'Completed' },
  'in_progress': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: Clock, label: 'In Progress' },
  'escalated': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', icon: AlertCircle, label: 'Escalated' },
  'open': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: Eye, label: 'Open' },
  'closed': { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-300', icon: XCircle, label: 'Closed' },
};

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  'critical': { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', icon: AlertCircle, label: 'Critical' },
  'high': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', icon: AlertCircle, label: 'High' },
  'medium': { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', icon: Clock, label: 'Medium' },
  'low': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: CheckCircle2, label: 'Low' },
};

const SIZE_CONFIG = {
  sm: { container: 'px-2 py-1 text-xs', icon: 'w-3 h-3' },
  md: { container: 'px-3 py-1.5 text-sm', icon: 'w-4 h-4' },
  lg: { container: 'px-4 py-2 text-base', icon: 'w-5 h-5' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusLower = status?.toLowerCase().replace(/\s+/g, '_') || 'pending';
  const config = STATUS_CONFIG[statusLower] || STATUS_CONFIG['pending'];
  const severityConfig = SEVERITY_CONFIG[statusLower];
  const finalConfig = severityConfig || config;
  const Icon = finalConfig.icon;
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${finalConfig.bg} ${finalConfig.text} ${sizeConfig.container} whitespace-nowrap`}>
      <Icon className={sizeConfig.icon} />
      <span>{finalConfig.label}</span>
    </div>
  );
}
