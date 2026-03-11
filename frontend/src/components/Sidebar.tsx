"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';
import { API_BASE_URL } from '../config/constants';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  PlusCircle,
  HelpCircle,
  Shield,
  UserCog,
  ClipboardList,
  Wrench,
  Home,
  Zap,
  User,
} from 'lucide-react';

type NavItem = { icon: React.ComponentType<{ className?: string }>; label: string; path: string };

export default function Sidebar() {
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { sidebarWidth, setSidebarWidth, isSidebarOpen: open, setIsSidebarOpen: setOpen } = useSidebar();
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [reportCount, setReportCount] = useState(0);

  // Fetch report count
  useEffect(() => {
    async function fetchReportCount() {
      if (!user || user.role === 'student' || user.role === 'hall_warden' || user.role === 'electrician') return;
      try {
        const res = await fetch(`${API_BASE_URL}/student-reports?status=Pending`, {
          headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch report count:', err);
      }
    }
    fetchReportCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchReportCount, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sidebar style classes
  const sidebarBase =
    'fixed z-40 left-0 top-0 h-screen bg-gray-900 text-white shadow-lg border-r border-gray-800 transform transition-transform duration-200 ease-in-out';
  const linkBase =
    'flex items-center gap-3 py-2 px-4 rounded-lg transition-all font-medium hover:bg-gray-200 dark:hover:bg-gray-800 text-sm sm:text-base';
  const linkActive =
    'bg-kmuGreen text-white shadow dark:bg-kmuGreen dark:text-white';

  // Role-based navs
  let navLinks: NavItem[] = [];
  if (user?.role === 'admin') {
    navLinks = [
      { icon: Shield, label: 'Dashboard', path: '/admin' },
      { icon: FolderOpen, label: 'All Cases', path: '/cases' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: Users, label: 'Students', path: '/students' },
      { icon: Wrench, label: 'Maintenance', path: '/maintenance' },
      { icon: ClipboardList, label: 'Evidence', path: '/evidence' },
      { icon: PlusCircle, label: 'New Case', path: '/cases/new' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'security_officer') {
    navLinks = [
      { icon: Home, label: 'Dashboard', path: '/security-dashboard' },
      { icon: FolderOpen, label: 'Cases', path: '/cases' },
      { icon: ClipboardList, label: 'Evidence', path: '/evidence' },
      { icon: Users, label: 'Students', path: '/students' },
      { icon: PlusCircle, label: 'New Case', path: '/cases/new' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'chief_security_officer') {
    navLinks = [
      { icon: Shield, label: 'Dashboard', path: '/chief-security-officer-dashboard' },
      { icon: FolderOpen, label: 'All Cases', path: '/cases' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: Users, label: 'Students', path: '/students' },
      { icon: ClipboardList, label: 'Evidence', path: '/evidence' },
      { icon: PlusCircle, label: 'New Case', path: '/cases/new' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'dean_of_students') {
    navLinks = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dean-of-students-dashboard' },
      { icon: Users, label: 'Students', path: '/dean-of-students-dashboard/students' },
      { icon: FolderOpen, label: 'Cases', path: '/dean-of-students-dashboard/cases' },
      { icon: FileText, label: 'Reports', path: '/dean-of-students-dashboard/reports' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'assistant_dean') {
    navLinks = [
      { icon: UserCog, label: 'Dashboard', path: '/assistant-dean-dashboard' },
      { icon: Users, label: 'Students', path: '/assistant-dean-dashboard/students' },
      { icon: FolderOpen, label: 'Cases', path: '/assistant-dean-dashboard/cases' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'secretary') {
    navLinks = [
      { icon: ClipboardList, label: 'Dashboard', path: '/secretary-dashboard' },
      { icon: Users, label: 'Students', path: '/students' },
      { icon: FolderOpen, label: 'Cases', path: '/cases' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'hall_warden') {
    navLinks = [
      { icon: Home, label: 'Dashboard', path: '/hall-warden-dashboard' },
      { icon: Wrench, label: 'Maintenance', path: '/hall-warden-dashboard/maintenance' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'electrician') {
    navLinks = [
      { icon: Zap, label: 'Dashboard', path: '/electrician-dashboard' },
      { icon: Wrench, label: 'Tasks', path: '/electrician-dashboard/tasks' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'student') {
    navLinks = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student-dashboard' },
      { icon: FolderOpen, label: 'My Records', path: '/student-dashboard/records' },
      { icon: User, label: 'Profile', path: '/student-dashboard/profile' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ];
  } else {
    navLinks = [{ icon: HelpCircle, label: 'Help', path: '/help' }];
  }

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    // Limit width between 200px and 400px
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity md:hidden ${open ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
      <aside
        className={`${sidebarBase} ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 dark:bg-gray-900 dark:text-white bg-white text-gray-900 flex flex-col`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col items-center gap-2 pt-8 pb-4 border-b border-gray-800 dark:border-gray-800 border-gray-200 px-4 relative">
          {/* Close button for mobile */}
          <button
            className="absolute top-2 right-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img
            src="/kmu_logo.svg"
            alt="KMU Logo"
            width={64}
            height={64}
            className="mb-2 h-16 w-16 object-contain"
          />
        </div>
        <nav className="flex flex-col gap-0.5 mt-6 px-4 pb-6 flex-1 justify-start overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path + link.label}
                href={link.path}
                className={`${linkBase} ${pathname === link.path ? linkActive : ''} text-gray-900 dark:text-white relative`}
                onClick={() => setOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
                {link.label === 'Student Reports' && reportCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                    {reportCount > 9 ? '9+' : reportCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Resize handle - only visible on desktop */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize hidden md:block"
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        />
      </aside>
    </>
  );
}
