import { ArticleForm } from '@/components/articles/article-form';
import { getTranslations } from 'next-intl/server';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CreateArticlePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.articles');
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">{t('createArticle')}</h1>
        <p className="text-muted-foreground">{t('createDescription')}</p>
      </div>
      <ArticleForm locale={locale} />
    </div>
  );
}
