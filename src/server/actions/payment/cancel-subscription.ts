'use server';

import { auth } from '@/lib/auth/auth';
import { StripeProvider } from '@/lib/payment/stripe/provider';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import type { ActionResult } from '@/types/payment';
import { headers } from 'next/headers';

export async function cancelSubscription(
  subscriptionId: string
): Promise<ActionResult<{ canceled: boolean }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return {
        success: false,
        error: '请先登录',
      };
    }

    // Verify subscription belongs to current user
    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
    if (!paymentRecord || paymentRecord.userId !== session.user.id) {
      return {
        success: false,
        error: '订阅不存在或无权操作',
      };
    }

    const stripeProvider = new StripeProvider();

    // Cancel Stripe subscription
    const canceled = await stripeProvider.cancelSubscription(subscriptionId);
    if (!canceled) {
      return {
        success: false,
        error: '取消订阅失败',
      };
    }

    // Update database record
    await paymentRepository.update(paymentRecord.id, {
      cancelAtPeriodEnd: true,
    });

    // Record event
    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'canceled',
      eventData: JSON.stringify({
        subscriptionId,
        canceledAt: new Date().toISOString(),
        cancelAtPeriodEnd: true,
      }),
    });

    return {
      success: true,
      data: {
        canceled: true,
      },
      message: '订阅已设置为在当前周期结束后取消',
    };

  } catch (error) {
    console.error('取消订阅失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取消订阅失败',
    };
  }
} 