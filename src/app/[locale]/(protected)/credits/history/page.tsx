import { Suspense } from 'react';
import { CreditHistoryPage } from '@/components/credits/credit-history-page';
import { CreditsPageSkeleton } from '@/components/credits/credits-skeleton';

export default function CreditHistoryPageRoute() {
  return (
    <Suspense fallback={<CreditsPageSkeleton />}>
      <CreditHistoryPage />
    </Suspense>
  );
}
