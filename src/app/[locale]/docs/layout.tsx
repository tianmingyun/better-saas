import { getDocsPages } from '@/lib/fumadoc/docs';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'zh' },
];

const translations = {
  zh: {
    search: '搜索',
    searchNoResult: '没有找到结果',
    toc: '目录',
    tocNoHeadings: '没有标题',
    lastUpdate: '最后更新',
    chooseLanguage: '选择语言',
    nextPage: '下一页',
    previousPage: '上一页',
  },
};

export default async function Layout({ children, params }: Props) {
  const { locale } = await params;

  const pages = getDocsPages(locale);

  const tree = {
    name: 'Documentation',
    children: pages.map((page) => ({
      type: 'page' as const,
      name: page.data.title,
      url: `/${locale}/docs/${page.slugs.slice(1).join('/')}`,
      external: false,
    })),
  };

  return (
    <RootProvider
      i18n={{
        locale,
        locales,
        translations: translations[locale as keyof typeof translations],
      }}
      theme={{
        enabled: false,
      }}
    >
      <DocsLayout
        tree={tree}
        nav={{
          title: 'Better SaaS Docs',
          url: `/${locale}/docs`,
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
