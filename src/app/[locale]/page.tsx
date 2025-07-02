import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

export default function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  
  // 启用静态渲染
  setRequestLocale(locale);
  
  const t = useTranslations('HomePage');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="font-extrabold text-5xl text-white tracking-tight sm:text-[5rem]">
          {t('title')} <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
        <p className="text-xl text-center max-w-2xl">
          {t('subtitle')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://create.t3.gg/en/usage/first-steps"
            target="_blank"
          >
            <h3 className="font-bold text-2xl">{t('firstSteps')} →</h3>
            <div className="text-lg">
              {t('firstStepsDescription')}
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://create.t3.gg/en/introduction"
            target="_blank"
          >
            <h3 className="font-bold text-2xl">{t('documentation')} →</h3>
            <div className="text-lg">
              {t('documentationDescription')}
            </div>
          </Link>
        </div>
        
        {/* 语言切换 */}
        <div className="mt-8">
          <LanguageSwitcher />
        </div>
      </div>
    </main>
  );
} 