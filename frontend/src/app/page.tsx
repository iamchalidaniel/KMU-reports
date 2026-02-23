"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // simply forward to /home; the home page will handle splash logic
  useEffect(() => {
    router.push('/home');
  }, [router]);

  return null;
} 
