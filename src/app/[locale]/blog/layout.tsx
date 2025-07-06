import { Footer } from '@/components/blocks/footer/footer';
import { NavbarWrapper } from '@/components/blocks/navbar/navbar-wrapper';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  
  const t = await getTranslations('blog');

  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title'),
    },
    description: t('description'),
  };
}

export default async function BlogLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarWrapper />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
