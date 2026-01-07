'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Code2, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Small delay to check auth state
    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, router, checkAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 animate-pulse">
          <Code2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">CloudCode</h1>
        <p className="text-gray-400 mb-8">IDE collaboratif en ligne</p>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
      </div>
    </div>
  );
}
