'use client';

import { AuthGuard } from '@/components/auth-guard';
import { ProtectedContainer } from '@/components/dashboard/protected-container';
import type { SidebarGroup } from '@/types';
import {
  Bell,
  CreditCard,
  Files,
  Home,
  LayoutDashboard,
  PenTool,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const t = useTranslations('sidebar');

  const sidebarGroups: SidebarGroup[] = [
    {
      title: t('dashboard'),
      defaultOpen: true,
      items: [
        {
          title: t('users'),
          href: '/dashboard/users',
          icon: Users,
        },
        {
          title: t('notifications'),
          href: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: t('files'),
          href: '/dashboard/files',
          icon: Files,
        },
        {
          title: t('articles'),
          href: '/dashboard/articles',
          icon: PenTool,
        },
      ],
    },
    {
      title: t('settings'),
      defaultOpen: true,
      items: [
        {
          title: t('profile'),
          href: '/settings/profile',
          icon: Users,
        },
        {
          title: t('billing'),
          href: '/settings/billing',
          icon: CreditCard,
        },
        {
          title: t('security'),
          href: '/settings/security',
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <AuthGuard useSkeletonFallback>
      <ProtectedContainer sidebarGroups={sidebarGroups}>{children}</ProtectedContainer>
    </AuthGuard>
  );
}
