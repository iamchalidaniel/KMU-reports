"use client";

import React, { useEffect, useState } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    type = 'danger'
}: ConfirmDialogProps) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    const typeStyles = {
        danger: {
            icon: "⚠️",
            button: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
            text: "text-red-600"
        },
        warning: {
            icon: "🔔",
            button: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
            text: "text-orange-600"
        },
        info: {
            icon: "ℹ️",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
            text: "text-blue-600"
        }
    };

    const currentStyle = typeStyles[type];

    return (
        <div
            className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCancel}
            />

            {/* Dialog Card */}
            <div
                className={`relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/20' : type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                            {currentStyle.icon}
                        </div>
                        <h3 className="text-xl font-black tracking-tight">{title}</h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-10 font-medium">
                        {message}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onCancel();
                            }}
                            className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 hover:-translate-y-0.5 ${currentStyle.button}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            </div>
        </div>
    );
}
