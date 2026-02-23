"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if splash has been shown before
    const splashShown = localStorage.getItem('splashShown');
    
    if (splashShown) {
      // If splash was shown before, go directly to home
      router.push('/home');
    } else {
      // First time, show splash
      localStorage.setItem('splashShown', 'true');
      router.push('/splash');
    }
  }, [router]);

  return null;
} 
