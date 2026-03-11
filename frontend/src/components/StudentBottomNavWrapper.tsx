"use client";

import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import StudentBottomNav from './StudentBottomNav';
import AssistantDeanBottomNav from './AssistantDeanBottomNav';
import DeanOfStudentsBottomNav from './DeanOfStudentsBottomNav';
import SecurityBottomNav from './SecurityBottomNav';
import HallWardenBottomNav from './HallWardenBottomNav';
import SecretaryBottomNav from './SecretaryBottomNav';
import ChiefSecurityOfficerBottomNav from './ChiefSecurityOfficerBottomNav';
import ElectricianBottomNav from './ElectricianBottomNav';
import AdminBottomNav from './AdminBottomNav';

export default function StudentBottomNavWrapper() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Return appropriate bottom nav based on user role
  if (user?.role === 'student' && pathname.startsWith('/student-dashboard')) {
    return <StudentBottomNav />;
  }

  if (user?.role === 'assistant_dean' && pathname.startsWith('/assistant-dean-dashboard')) {
    return <AssistantDeanBottomNav />;
  }

  if (user?.role === 'dean_of_students' && pathname.startsWith('/dean-of-students-dashboard')) {
    return <DeanOfStudentsBottomNav />;
  }

  if (user?.role === 'security_officer' && pathname.startsWith('/security-dashboard')) {
    return <SecurityBottomNav />;
  }

  if (user?.role === 'hall_warden' && pathname.startsWith('/hall-warden-dashboard')) {
    return <HallWardenBottomNav />;
  }

  if (user?.role === 'secretary' && pathname.startsWith('/secretary-dashboard')) {
    return <SecretaryBottomNav />;
  }

  if (user?.role === 'chief_security_officer' && pathname.startsWith('/chief-security-officer-dashboard')) {
    return <ChiefSecurityOfficerBottomNav />;
  }

  if (user?.role === 'electrician' && pathname.startsWith('/electrician-dashboard')) {
    return <ElectricianBottomNav />;
  }

  if (
    user?.role === 'admin' ||
    ['/admin', '/reports', '/cases', '/students', '/maintenance'].some(p => pathname.startsWith(p)) && user?.role === 'admin'
  ) {
    return <AdminBottomNav />;
  }

  return null;
}
