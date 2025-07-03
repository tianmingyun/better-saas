import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false,
});

const localeConfig = {
  en: {
    name: 'English',
    locale: 'en' as const,
  },
  zh: {
    name: '中文',
    locale: 'zh' as const,
  },
} as const;

export const locales = routing.locales.map((locale) => ({
  name: localeConfig[locale as keyof typeof localeConfig]?.name || locale,
  locale,
}));
