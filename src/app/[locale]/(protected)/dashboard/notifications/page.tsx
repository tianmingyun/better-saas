'use client';

import { AdminGuard } from '@/components/admin-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Settings, 
  Users, 
  Mail, 
  MessageSquare, 
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotificationsPage() {
  const t = useTranslations('sidebar');

  const notifications = [
    {
      id: 1,
      type: 'info',
      title: '系统维护通知',
      message: '系统将于今晚 22:00-24:00 进行维护升级',
      time: '2小时前',
      read: false,
    },
    {
      id: 2,
      type: 'success',
      title: '订单支付成功',
      message: '您的订单 #12345 已支付成功',
      time: '4小时前',
      read: true,
    },
    {
      id: 3,
      type: 'warning',
      title: '账户安全提醒',
      message: '检测到异常登录，请及时修改密码',
      time: '1天前',
      read: false,
    },
    {
      id: 4,
      type: 'info',
      title: '新功能上线',
      message: '我们推出了全新的数据分析功能',
      time: '2天前',
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
              <Bell className="h-8 w-8" />
              {t('notifications')}
            </h1>
            <p className="text-muted-foreground">查看和管理您的通知</p>
          </div>
          <Button variant="outline">全部标记为已读</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">未读通知</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">2</div>
              <p className="text-muted-foreground text-xs">需要您的关注</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">今日通知</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">3</div>
              <p className="text-muted-foreground text-xs">较昨日减少 2 条</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">总通知</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">24</div>
              <p className="text-muted-foreground text-xs">本月收到的通知</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>通知列表</CardTitle>
            <CardDescription>最近的通知消息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 rounded-lg border p-4 ${
                    notification.read ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm">{notification.title}</p>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            未读
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-xs">{notification.time}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground text-sm">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
