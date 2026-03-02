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
    type?: 'danger' | 'warning' | 'info' | 'error';
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
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            button: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
            bg: "bg-red-50 dark:bg-red-900/20",
            text: "text-red-600 dark:text-red-400"
        },
        error: {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            button: "bg-red-700 hover:bg-red-800 shadow-red-600/20",
            bg: "bg-red-100 dark:bg-red-950/40",
            text: "text-red-700 dark:text-red-400"
        },
        warning: {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            button: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-600 dark:text-orange-400"
        },
        info: {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            text: "text-blue-600 dark:text-blue-400"
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
                className={`relative bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentStyle.bg} ${currentStyle.text}`}>
                            {currentStyle.icon}
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">{title}</h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-10 font-medium">
                        {message}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onCancel();
                            }}
                            className={`flex-1 px-6 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 hover:-translate-y-0.5 ${currentStyle.button}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 ${type === 'danger' || type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            </div>
        </div>
    );
}
