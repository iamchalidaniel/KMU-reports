"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';
import { API_BASE_URL } from '../config/constants';

// Optimized nav icons - using simple emojis for faster loading
const navIcons = {
  dashboard: '🏠',
  cases: '📄',
  reports: '🧾',
  evidence: '📎',
  students: '👤',
  newcase: '➕',
  logout: '🚪',
  admin: '🛡️',
  academic: '🎓',
  dean: '👨‍🎓',
  audit: '🔍',
  users: '👥',
  profile: '👤',
  help: '❓',
  security: '🔒',
  assistant: '👨‍💼',
  secretary: '📋',
  maintenance: '🔧',
  hall: '🏠',
  electrician: '⚡',
};

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

  // Role-based navs - Removed duplicates (Profile, Settings, Logout)
  let navLinks = [];
  if (user?.role === 'admin') {
    navLinks = [
      { icon: navIcons.admin, label: 'Administrator Dashboard', path: '/admin' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.reports, label: 'Student Reports', path: '/reports' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.maintenance, label: 'Maintenance', path: '/maintenance' },
      { icon: navIcons.evidence, label: 'Evidence', path: '/evidence' },
      { icon: navIcons.newcase, label: 'New Case', path: '/cases/new' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'security_officer') {
    navLinks = [
      { icon: navIcons.dashboard, label: 'Home', path: '/security-dashboard' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.evidence, label: 'Evidence', path: '/evidence' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.newcase, label: 'New Case', path: '/cases/new' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'chief_security_officer') {
    navLinks = [
      { icon: navIcons.security, label: 'Home', path: '/chief-security-officer-dashboard' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.reports, label: 'Student Reports', path: '/reports' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.evidence, label: 'Evidence', path: '/evidence' },
      { icon: navIcons.newcase, label: 'New Case', path: '/cases/new' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'dean_of_students') {
    navLinks = [
      { icon: navIcons.dean, label: 'Home', path: '/dean-of-students-dashboard' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.reports, label: 'Student Reports', path: '/reports' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'assistant_dean') {
    navLinks = [
      { icon: navIcons.assistant, label: 'Home', path: '/assistant-dean-dashboard' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.reports, label: 'Student Reports', path: '/reports' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'secretary') {
    navLinks = [
      { icon: navIcons.secretary, label: 'Home', path: '/secretary-dashboard' },
      { icon: navIcons.students, label: 'Students', path: '/students' },
      { icon: navIcons.cases, label: 'Cases', path: '/cases' },
      { icon: navIcons.reports, label: 'Student Reports', path: '/reports' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'hall_warden') {
    navLinks = [
      { icon: navIcons.hall, label: 'Dashboard', path: '/hall-warden-dashboard' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'electrician') {
    navLinks = [
      { icon: navIcons.electrician, label: 'Dashboard', path: '/electrician-dashboard' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else if (user?.role === 'student') {
    navLinks = [
      { icon: navIcons.dashboard, label: 'Dashboard', path: '/student-dashboard' },
      { icon: navIcons.reports, label: 'My Statements', path: '/student-dashboard/statements' },
      { icon: navIcons.cases, label: 'My Cases', path: '/student-dashboard/cases' },
      { icon: navIcons.secretary, label: 'Appeals', path: '/student-dashboard/appeals' },
      { icon: navIcons.profile, label: 'Profile & Records', path: '/student-dashboard/profile' },
      { icon: navIcons.help, label: 'Help', path: '/help' },
    ];
  } else {
    navLinks = [{ icon: navIcons.help, label: 'Help', path: '/help' }];
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
          {navLinks.map(link => (
            <Link
              key={link.path + link.label}
              href={link.path}
              className={
                `${linkBase} ${pathname === link.path ? linkActive : ''} text-gray-900 dark:text-white relative`}
              onClick={() => setOpen(false)} // Close sidebar on mobile when clicking a link
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label}</span>
              {link.label === 'Student Reports' && reportCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                  {reportCount > 9 ? '9+' : reportCount}
                </span>
              )}
            </Link>
          ))}
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
