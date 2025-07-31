import { Metadata } from 'next';
import { getI18n } from '@/i18n/request';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DifyExploreContent } from '@/components/dify/dify-explore-content';

export const metadata: Metadata = {
  title: 'Dify AI Apps',
  description: 'Explore and use AI-powered Dify applications',
};

export default async function DifyExplorePage() {
  const t = await getI18n();

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