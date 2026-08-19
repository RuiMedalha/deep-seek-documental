'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Deep Seek Documental</h1>
        <p className="text-gray-600">A redirecionar...</p>
      </div>
    </div>
  );
}