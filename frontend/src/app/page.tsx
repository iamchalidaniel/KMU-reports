"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to splash screen like Facebook - no localStorage check
    router.push('/splash');
  }, [router]);

  return null;
} 
