import { Hero } from '@/components/blocks/hero/hero';
import { TechStack } from '@/components/blocks/tech-stack';
import { Pricing } from '@/components/blocks/pricing/pricing';
import { Faq } from '@/components/blocks/faq/faq';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function HomePage() {
  const faqData = useTranslations('faq');
  return (
    <>
      <Hero />
      <TechStack />
      <Pricing />
      <Faq
        heading={faqData('heading')}
        description={faqData('description')}
        supportHeading={faqData('supportHeading')}
        supportDescription={faqData('supportDescription')}
        supportButtonText={faqData('supportButtonText')}
        supportButtonUrl=""
      />
    </>
  );
}
