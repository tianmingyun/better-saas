import { DeleteArticleButton } from '@/components/articles/delete-article-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { articleService } from '@/db/services';
import type { ArticleStatus, ArticleVisibility } from '@/db/types';
import { EditIcon, EyeIcon, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    status?: ArticleStatus;
    language?: string;
    search?: string;
  }>;
}

export default async function ArticlesManagePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page = '1', status, language, search } = await searchParams;
  const t = await getTranslations('dashboard.articles');

  const result = await articleService.getAllArticles({
    page: Number.parseInt(page),
    limit: 20,
    status,
    language,
    search,
  });

  const { articles, total, totalPages, currentPage } = result;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">{t('published')}</Badge>;
      case 'draft':
        return <Badge variant="secondary">{t('draft')}</Badge>;
      case 'archived':
        return <Badge variant="outline">{t('archived')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVisibilityBadge = (visibility: ArticleVisibility) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="outline">{t('public')}</Badge>;
      case 'authenticated':
        return <Badge variant="secondary">{t('authenticated')}</Badge>;
      case 'premium':
        return <Badge variant="default">{t('premium')}</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/articles/create`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('createArticle')}
          </Link>
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
          <CardDescription>筛选和搜索文章</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              <Input placeholder={t('search')} defaultValue={search} className="w-full" />
            </div>

            <Select defaultValue={status || 'all'}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="draft">{t('draft')}</SelectItem>
                <SelectItem value="published">{t('published')}</SelectItem>
                <SelectItem value="archived">{t('archived')}</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue={language || 'all'}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('language')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('form.title')}</TableHead>
                <TableHead>{t('language')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('visibility')}</TableHead>
                <TableHead>{t('isPinned')}</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{article.title}</div>
                      {article.description && (
                        <div className="line-clamp-1 text-muted-foreground text-sm">
                          {article.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {article.language === 'zh' ? '中文' : 'English'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>
                    {getVisibilityBadge(article.visibility as ArticleVisibility)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.isPinned ? 'default' : 'outline'}>
                      {article.isPinned ? t('yes') : t('no')}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(article.updatedAt).toLocaleDateString(locale)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/${locale}/articles/${article.slug}`}>
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/${locale}/dashboard/articles/${article.id}/edit`}>
                          <EditIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteArticleButton articleId={article.id} articleTitle={article.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            共 {total} 篇文章，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button variant="outline" asChild>
                <Link href={`?page=${currentPage - 1}`}>上一页</Link>
              </Button>
            )}
            {currentPage < totalPages && (
              <Button variant="outline" asChild>
                <Link href={`?page=${currentPage + 1}`}>下一页</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
