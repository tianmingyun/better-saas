import { BillingPage } from '@/components/billing/billing-page';
import { Suspense } from 'react';

export default function BillingPageRoute() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <BillingPage />
    </Suspense>
  );
} 