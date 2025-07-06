import { Hero } from '@/components/blocks/hero/hero';
import { TechStack } from '@/components/blocks/tech-stack';
import { Pricing } from '@/components/blocks/pricing/pricing';
import React from 'react';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TechStack />
      <Pricing />
    </>
  );
}
