'use client';

import { AuthGuard } from '@/components/auth-guard';
import { ProtectedContainer } from '@/components/dashboard/protected-container';
import { useIsAdmin } from '@/store/auth-store';
import type { SidebarGroup } from '@/types';
import {
  Bell,
  CreditCard,
  Files,
  PenTool,
  Shield,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const t = useTranslations('sidebar');
  const isAdmin = useIsAdmin();

  const sidebarGroups: SidebarGroup[] = useMemo(() => {
    const groups: SidebarGroup[] = [];

    // 管理员才能看到 Dashboard 菜单
    if (isAdmin) {
      groups.push({
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
      });
    }

    // 所有登录用户都能看到 Settings 菜单
    groups.push({
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
    });

    return groups;
  }, [isAdmin, t]);

  return (
    <Suspense fallback={<div>loading...</div>}>
      <AuthGuard useSkeletonFallback>
        <ProtectedContainer sidebarGroups={sidebarGroups}>{children}</ProtectedContainer>
      </AuthGuard>
    </Suspense>
  );
}
