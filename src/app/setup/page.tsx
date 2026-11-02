'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCrmStore } from '@/store/useCrmStore';
import { InstallWizard } from '@/components/wizard/InstallWizard';

export default function SetupPage() {
  const router = useRouter();
  const setupCompleted = useCrmStore((s) => s.setupCompleted);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && setupCompleted) {
      router.replace('/login');
    }
  }, [hydrated, setupCompleted, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F6F9] text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  if (setupCompleted) return null;

  return <InstallWizard />;
}
