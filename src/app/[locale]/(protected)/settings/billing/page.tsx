import { BillingPage } from '@/components/billing/billing-page';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Suspense } from 'react';

export default function BillingPageRoute() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BillingPage />
    </Suspense>
  );
} 