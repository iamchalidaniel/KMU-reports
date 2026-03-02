"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <nav className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Left Side: Mobile Menu Button (handled by Sidebar usually, but we could add desktop breadcrumbs here) */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-kmuGreen to-kmuOrange bg-clip-text text-transparent hidden sm:block">
                            KMU DISCIPLINE DESK
                        </h1>
                    </div>

                    {/* Right Side: Profile & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Sponsor Info (as seen in screenshot) */}
                        <div className="hidden lg:flex flex-col items-end text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                            <span className="text-red-500 font-bold uppercase">Sponsor</span>
                            <span className="font-semibold uppercase">{user.name || user.username}</span>
                            <span className="text-blue-500 uppercase font-mono">{user.studentId || 'STAFF'}</span>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white dark:ring-gray-700">
                                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:flex flex-col items-start leading-tight">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{user.name || user.username}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</span>
                                </div>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-100 origin-top-right">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 md:hidden">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || user.username}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                                    </div>

                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <span className="text-lg">👤</span>
                                        <span>User profile</span>
                                    </Link>

                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <span className="text-lg">⚙️</span>
                                        <span>Settings</span>
                                    </Link>

                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <span className="text-lg">➔</span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
