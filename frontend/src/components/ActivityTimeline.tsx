"use client";

import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  User,
  Clock,
} from 'lucide-react';

export interface Activity {
  id: string;
  type: 'created' | 'approved' | 'rejected' | 'updated' | 'commented' | 'changed';
  title: string;
  description?: string;
  user: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading?: boolean;
}

export default function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return FileText;
      case 'approved':
        return CheckCircle2;
      case 'rejected':
        return XCircle;
      case 'updated':
        return Edit;
      case 'changed':
        return AlertCircle;
      case 'commented':
        return User;
      default:
        return Clock;
    }
  };

  const getColor = (type: Activity['type']) => {
    switch (type) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'updated':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'created':
        return 'bg-kmuGreen/10 dark:bg-kmuGreen/20 text-kmuGreen';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => {
        const Icon = getIcon(activity.type);
        const colorClass = getColor(activity.type);
        const timestamp =
          typeof activity.timestamp === 'string'
            ? new Date(activity.timestamp)
            : activity.timestamp;

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`p-2.5 rounded-full ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 my-2" />
              )}
            </div>

            <div className="flex-1 pt-1 pb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>

              {activity.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.description}
                </p>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                by {activity.user}
              </p>

              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 rounded p-2 space-y-1">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-gray-300 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
