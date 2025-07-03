import { Hero } from '@/components/blocks/hero/hero';
import { Navbar } from '@/components/blocks/navbar/navbar';
import React from 'react';

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col ">
      <Navbar />
      <Hero />
    </main>
  );
}
