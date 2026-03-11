"use client";

import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import StudentBottomNav from './StudentBottomNav';

export default function StudentBottomNavWrapper() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role !== 'student' || !pathname.startsWith('/student-dashboard')) {
    return null;
  }

  return <StudentBottomNav />;
}
