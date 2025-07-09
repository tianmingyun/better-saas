import { defineRouting } from 'next-intl/routing';
import { i18nConfig } from '../config/i18n.config';

export const routing = defineRouting({
  locales: i18nConfig.locales,
  defaultLocale: i18nConfig.defaultLocale,
  localePrefix: i18nConfig.routing.localePrefix,
  localeDetection: i18nConfig.routing.localeDetection,
});

export const locales = i18nConfig.locales.map((locale) => ({
  name: i18nConfig.languages[locale]?.name || locale,
  locale,
}));
