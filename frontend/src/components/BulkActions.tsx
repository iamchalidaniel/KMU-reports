"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'danger' | 'warning' | 'success' | 'default';
  onAction: (selectedIds: string[]) => Promise<void> | void;
  confirmMessage?: string;
}

interface BulkActionsProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export default function BulkActions({
  selectedCount,
  actions,
  onClear,
}: BulkActionsProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: BulkAction | null;
  }>({ isOpen: false, action: null });

  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: BulkAction) => {
    if (action.confirmMessage) {
      setConfirmDialog({ isOpen: true, action });
    } else {
      await executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setIsLoading(true);
    try {
      await action.onAction([]);
    } finally {
      setIsLoading(false);
      setConfirmDialog({ isOpen: false, action: null });
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 md:relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 md:rounded-xl shadow-lg md:shadow-sm animate-in slide-in-from-bottom duration-200 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedCount} selected
            </span>
            <button
              onClick={onClear}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action) => {
              const colorMap = {
                danger: 'bg-red-600 hover:bg-red-700 text-white',
                warning: 'bg-amber-600 hover:bg-amber-700 text-white',
                success: 'bg-green-600 hover:bg-green-700 text-white',
                default: 'bg-kmuGreen hover:bg-kmuGreen/90 text-white',
              };

              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2 ${
                    colorMap[action.variant || 'default']
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action?.label || 'Confirm'}
        description={confirmDialog.action?.confirmMessage || 'Are you sure?'}
        onConfirm={() => executeAction(confirmDialog.action!)}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
        confirmText={confirmDialog.action?.label || 'Confirm'}
        variant={confirmDialog.action?.variant || 'default'}
        isLoading={isLoading}
      />
    </>
  );
}
