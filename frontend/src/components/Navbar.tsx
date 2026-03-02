"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
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
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-kmuGreen to-kmuOrange bg-clip-text text-transparent hidden xs:block">
                            KMU DISCIPLINE DESK
                        </h1>
                    </div>

                    {/* Right Side: Theme, Profile & Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Theme Toggle */}
                        <DarkModeToggle />

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
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 md:hidden">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{user.name || user.username}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
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
