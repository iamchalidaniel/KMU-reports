"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentStatementsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student-dashboard/records?tab=statements');
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-kmuGreen">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-kmuGreen border-t-transparent" />
    </div>
  );
}
