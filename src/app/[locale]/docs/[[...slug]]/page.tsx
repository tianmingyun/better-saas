import { getMDXComponents } from '@/components/mdx-components';
import { getDocsPage, getDocsPages } from '@/lib/fumadoc/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  const page = getDocsPage(slug || [], locale);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const locales = ['en', 'zh'];
  const params: { locale: string; slug?: string[] }[] = [];

  // 为每个语言生成参数
  for (const locale of locales) {
    const pages = getDocsPages(locale);
    for (const page of pages) {
      // 去掉语言前缀，只保留实际的文档路径
      const slug = page.slugs.slice(1); // 去掉第一个元素（语言前缀）
      params.push({
        locale,
        slug: slug.length > 0 ? slug : undefined, // 如果是空数组，设为 undefined
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const page = getDocsPage(slug || [], locale);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
