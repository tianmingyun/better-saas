import { Suspense } from 'react';
import { CreditsPage } from '@/components/credits/credits-page';
import { CreditsPageSkeleton } from '@/components/credits/credits-skeleton';

export default function CreditsPageRoute() {
  return (
    <Suspense fallback={<CreditsPageSkeleton />}>
      <CreditsPage />
    </Suspense>
  );
}
