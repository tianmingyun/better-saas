import { ArticleForm } from '@/components/articles/article-form';
import { articleService } from '@/db/services';
import type { ArticleStatus, ArticleVisibility } from '@/db/types';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations('dashboard.articles');

  const article = await articleService.getArticleById(id);

  if (!article) {
    notFound();
  }

  // 转换数据格式
  const initialData = {
    title: article.title,
    slug: article.slug,
    description: article.description || '',
    content: article.content,
    language: article.language,
    status: article.status as ArticleStatus,
    visibility: article.visibility as ArticleVisibility,
    isPinned: article.isPinned,
    coverImageId: article.coverImageId,
    tags: article.tags.map((tag) => tag.name),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">{t('editArticle')}</h1>
        <p className="text-muted-foreground">编辑文章内容和设置</p>
      </div>

      <ArticleForm locale={locale} articleId={id} initialData={initialData} />
    </div>
  );
}
