import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DifyExploreContent } from '@/components/dify/dify-explore-content';

export const metadata: Metadata = {
  title: 'Dify AI Apps',
  description: 'Explore and use AI-powered Dify applications',
};

export default async function DifyExplorePage() {
  const t = await getTranslations();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl tracking-tight">
          {t('dify.explore.title', { default: 'Dify AI Apps' })}
        </h1>
      </div>
      <p className="text-muted-foreground">
        {t('dify.explore.description', {
          default: 'Discover and interact with AI applications powered by Dify',
        })}
      </p>
      <DifyExploreContent />
    </div>
  );
}