'use client';

import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useAuthLoading,
  useAuthError,
  useIsAuthenticated,
  useUser,
  useAuthInitialized, 
  useRefreshSession 
} from '@/store/auth-store';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showLoginPrompt?: boolean;
  useSkeletonFallback?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/login',
  showLoginPrompt = true,
  useSkeletonFallback = false,
}: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const user = useUser();
  const isInitialized = useAuthInitialized();
  const refreshSession = useRefreshSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');

  useEffect(() => {
    // 只有在初始化完成且未认证时才重定向
    if (isInitialized && !isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('callbackUrl', currentPath);
      router.push(loginUrl.toString());
    }
  }, [isInitialized, isLoading, isAuthenticated, redirectTo, router]);

  // 显示加载状态
  if (!isInitialized || isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (useSkeletonFallback) {
      return <LoadingSkeleton />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground text-sm">
              {t('loading', { defaultValue: '正在验证身份...' })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 显示错误状态
  if (error && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('error', { defaultValue: '认证错误' })}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => refreshSession()} className="w-full">
              {t('refreshSession', { defaultValue: '刷新会话' })}
            </Button>
            <Button variant="outline" onClick={() => router.push(redirectTo)} className="w-full">
              {t('goToLogin', { defaultValue: '前往登录' })}
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">
              {t('retry', { defaultValue: '重试' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 显示未认证状态
  if (!isAuthenticated) {
    if (!showLoginPrompt) {
      return null;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t('accessDenied', { defaultValue: '访问受限' })}</CardTitle>
            <CardDescription>
              {t('loginRequired', { defaultValue: '请登录后访问此页面' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const currentPath = window.location.pathname + window.location.search;
                const loginUrl = new URL(redirectTo, window.location.origin);
                loginUrl.searchParams.set('callbackUrl', currentPath);
                router.push(loginUrl.toString());
              }}
              className="w-full"
            >
              {t('login', { defaultValue: '立即登录' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 用户已认证，显示受保护的内容
  return <>{children}</>;
}
