'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cancelSubscription } from '@/server/actions/payment/cancel-subscription';
import type { PaymentRecord } from '@/types/payment';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

interface SubscriptionCardProps {
  subscription: PaymentRecord;
  onUpdate?: () => void;
}

export function SubscriptionCard({ subscription, onUpdate }: SubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '未知';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'trialing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'past_due':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'canceled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'trialing':
        return '试用中';
      case 'past_due':
        return '逾期';
      case 'canceled':
        return '已取消';
      case 'incomplete':
        return '未完成';
      default:
        return status;
    }
  };

  const handleCancelSubscription = () => {
    startTransition(async () => {
      try {
        if (!subscription.subscriptionId) {
          toast.error('订阅ID不存在');
          return;
        }
        const result = await cancelSubscription(subscription.subscriptionId);
        if (result.success) {
          toast.success(result.message || '订阅取消成功');
          onUpdate?.();
        } else {
          toast.error(result.error || '取消订阅失败');
        }
      } catch (error) {
        toast.error('取消订阅失败');
        console.error('Cancel subscription error:', error);
      }
    });
  };

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isTrialing = subscription.status === 'trialing';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              当前订阅
            </CardTitle>
            <CardDescription>
              您的订阅计划详情
            </CardDescription>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {getStatusText(subscription.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">计费周期</div>
            <div className="font-medium">
              {subscription.interval === 'month' ? '月付' : subscription.interval === 'year' ? '年付' : '一次性'}
            </div>
          </div>
          
          {subscription.periodStart && subscription.periodEnd && (
            <div>
              <div className="text-sm text-muted-foreground">当前周期</div>
              <div className="font-medium text-sm">
                {formatDate(subscription.periodStart)} - {formatDate(subscription.periodEnd)}
              </div>
            </div>
          )}
        </div>

        {isTrialing && subscription.trialEnd && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <div className="text-sm">
              <span className="font-medium text-blue-500">试用期至：</span>
              <span className="ml-1">{formatDate(subscription.trialEnd)}</span>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div className="text-sm">
              <span className="font-medium text-yellow-500">将在周期结束时取消：</span>
              <span className="ml-1">{formatDate(subscription.periodEnd)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>订阅开始时间：{formatDate(subscription.createdAt)}</span>
        </div>
      </CardContent>

      {isActive && !subscription.cancelAtPeriodEnd && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? '处理中...' : '取消订阅'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 