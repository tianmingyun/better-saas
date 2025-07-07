'use client';

import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations('sidebar');

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{t('users')}</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">1,234</div>
              <p className="text-muted-foreground text-xs">+12% 较上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">892</div>
              <p className="text-muted-foreground text-xs">+8% 较上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">新注册</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">156</div>
              <p className="text-muted-foreground text-xs">+24% 较上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">付费用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">342</div>
              <p className="text-muted-foreground text-xs">+18% 较上月</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>系统中的所有用户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-muted-foreground">用户列表功能正在开发中...</div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
