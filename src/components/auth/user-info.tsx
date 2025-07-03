'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useAuthLoading, useIsAuthenticated, useUser } from '@/store/auth-store';
import { toast } from 'sonner';

export function UserInfo() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const { signOut } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>未登录</CardTitle>
          <CardDescription>请先登录您的账户</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('退出登录成功');
    } catch (error) {
      toast.error('退出登录失败');
    }
  };

  // 获取用户名首字母作为头像 fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>用户信息</CardTitle>
        <CardDescription>您的账户详情</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <p className="text-muted-foreground text-xs">ID: {user.id}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">邮箱验证状态:</span>
            <span className={user.emailVerified ? 'text-green-600' : 'text-orange-600'}>
              {user.emailVerified ? '已验证' : '未验证'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">注册时间:</span>
            <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">最后更新:</span>
            <span>{new Date(user.updatedAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? '退出中...' : '退出登录'}
        </Button>
      </CardContent>
    </Card>
  );
}
