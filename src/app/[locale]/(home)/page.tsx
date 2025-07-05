'use client';

import { Hero } from '@/components/blocks/hero/hero';
import { Navbar } from '@/components/blocks/navbar/navbar';
import { useNavbar } from '@/hooks/use-navbar';
import React from 'react';

export default function HomePage() {
  const navbarData = useNavbar();

  return (
    <main className="flex min-h-screen flex-col ">
      <Navbar 
        logo={navbarData.logo}
        menu={navbarData.menu}
        auth={navbarData.auth}
        locale={navbarData.locale}
        isAuthenticated={navbarData.isAuthenticated}
        isLoading={navbarData.isLoading}
        isInitialized={navbarData.isInitialized}
        onPricingClick={navbarData.handlePricingClick}
      />
      <Hero />
    </main>
  );
}
