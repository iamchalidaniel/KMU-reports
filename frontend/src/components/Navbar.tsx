"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import NotificationCenter from './NotificationCenter';
import Tooltip from './Tooltip';
import { Menu, ChevronDown, Settings, LogOut, AlertTriangle, Wrench } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
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
        <nav className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    {/* Left Side: Mobile Menu Button & Brand */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden text-gray-600 dark:text-gray-400"
                            aria-label="Toggle Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-kmuGreen to-kmuOrange bg-clip-text text-transparent hidden xs:block">
                            KMU DISCIPLINE DESK
                        </h1>
                    </div>

                    {/* Right Side: Student actions (Report / Repair), Theme, Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {user.role === 'student' && (
                            <>
                                <Link
                                    href="/student-dashboard/report-incident"
                                    className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Report
                                </Link>
                                <Link
                                    href="/student-dashboard/request-repair"
                                    className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                >
                                    <Wrench className="w-4 h-4" />
                                    Repair
                                </Link>
                            </>
                        )}
                        {/* Notifications */}
                        <NotificationCenter
                          notifications={notifications}
                          onMarkAsRead={(id) => {
                            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                          }}
                          onDismiss={(id) => {
                            setNotifications(prev => prev.filter(n => n.id !== id));
                          }}
                          onMarkAllAsRead={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          }}
                        />

                        {/* Theme Toggle with Tooltip */}
                        <Tooltip content="Toggle dark mode" position="bottom">
                          <DarkModeToggle />
                        </Tooltip>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white dark:ring-gray-700">
                                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:flex flex-col items-start leading-tight">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white underline decoration-kmuGreen decoration-2 underline-offset-4">{user.name || user.username}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-100 origin-top-right">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 md:hidden">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{user.name || user.username}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>

                                    <Link
                                        href={user.role === 'student' ? '/student-dashboard/profile' : '/profile'}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Settings className="w-5 h-5 text-gray-500" />
                                        <span>Profile & Settings</span>
                                    </Link>

                                    <div className="md:hidden border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                    <div className="md:hidden flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                        <span>Dark Mode</span>
                                        <DarkModeToggle />
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
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
