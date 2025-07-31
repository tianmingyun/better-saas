import { Metadata } from 'next';
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
    <DashboardContent
      title={t('dify.explore.title', { default: 'Dify AI Apps' })}
      description={t('dify.explore.description', {
        default: 'Discover and interact with AI applications powered by Dify',
      })}
    >
      <DifyExploreContent />
    </DashboardContent>
  );
}