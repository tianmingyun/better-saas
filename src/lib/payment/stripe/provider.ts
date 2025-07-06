import { stripe, stripeConfig } from './client';
import type {
  PaymentProvider,
  CreatePaymentParams,
  CreateSubscriptionParams,
  CreateSubscriptionCheckoutParams,
  UpdateSubscriptionParams,
  PaymentResult,
  SubscriptionResult,
  PaymentStatus,
} from '@/types/payment';
import type Stripe from 'stripe';

export class StripeProvider implements PaymentProvider {
  /**
   * Create customer
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });
      return customer.id;
    } catch (error) {
      console.error('创建 Stripe 客户失败:', error);
      throw new Error('创建客户失败');
    }
  }

  /**
   * Create one-time payment
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const { userId, priceId, customerId, successUrl, cancelUrl, metadata } = params;

      if (!customerId) {
        throw new Error('需要提供客户ID');
      }

          // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
        metadata: {
          userId,
          ...metadata,
        },
      });

      return {
        id: session.id,
        status: 'incomplete' as PaymentStatus,
        url: session.url || undefined,
        customerId,
        clientSecret: session.client_secret || undefined,
      };
    } catch (error) {
      console.error('创建支付失败:', error);
      throw new Error('创建支付失败');
    }
  }

  /**
   * Create subscription payment session
   */
  async createSubscriptionCheckout(params: CreateSubscriptionCheckoutParams): Promise<PaymentResult> {
    try {
      const { userId, priceId, customerId, successUrl, cancelUrl, trialPeriodDays, metadata } = params;

      if (!customerId) {
        throw new Error('需要提供客户ID');
      }

          // Create subscription Checkout Session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
        subscription_data: {
          trial_period_days: trialPeriodDays,
          metadata: {
            userId,
            ...metadata,
          },
        },
        metadata: {
          userId,
          ...metadata,
        },
      });

      return {
        id: session.id,
        status: 'incomplete' as PaymentStatus,
        url: session.url || undefined,
        customerId,
        clientSecret: session.client_secret || undefined,
      };
    } catch (error) {
      console.error('创建订阅支付会话失败:', error);
      throw new Error('创建订阅支付会话失败');
    }
  }

  /**
   * 创建订阅
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const { userId, priceId, customerId, trialPeriodDays, metadata } = params;

      if (!customerId) {
        throw new Error('需要提供客户ID');
      }

      // 获取价格信息
      const price = await stripe.prices.retrieve(priceId);

      // 创建订阅
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          ...metadata,
        },
      });

      // 安全地处理时间戳转换
      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;
      
      return {
        id: subscription.id,
        status: subscription.status as PaymentStatus,
        customerId,
        priceId,
        interval: (price.recurring?.interval as 'month' | 'year') || null,
        periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('创建订阅失败:', error);
      throw new Error('创建订阅失败');
    }
  }

  /**
   * 更新订阅
   */
  async updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const { priceId, cancelAtPeriodEnd, metadata } = params;

      const updateData: Stripe.SubscriptionUpdateParams = {};

      if (priceId) {
        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentItem = currentSubscription.items.data[0];
        
        if (!currentItem) {
          throw new Error('订阅项目不存在');
        }

        updateData.items = [
          {
            id: currentItem.id,
            price: priceId,
          },
        ];
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, updateData);
      const priceItem = subscription.items.data[0];
      
      if (!priceItem) {
        throw new Error('订阅价格项目不存在');
      }
      
      const price = await stripe.prices.retrieve(priceItem.price.id);

      // 安全地处理时间戳转换
      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;

      return {
        id: subscription.id,
        status: subscription.status as PaymentStatus,
        customerId: subscription.customer as string,
        priceId: priceItem.price.id,
        interval: (price.recurring?.interval as 'month' | 'year') || null,
        periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
      };
    } catch (error) {
      console.error('更新订阅失败:', error);
      throw new Error('更新订阅失败');
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return true;
    } catch (error) {
      console.error('取消订阅失败:', error);
      return false;
    }
  }

  /**
   * 获取订阅信息
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResult | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceItem = subscription.items.data[0];
      
      if (!priceItem) {
        return null;
      }
      
      const price = await stripe.prices.retrieve(priceItem.price.id);

      // 安全地处理时间戳转换
      const currentPeriodStart = (subscription as any).current_period_start;
      const currentPeriodEnd = (subscription as any).current_period_end;

      return {
        id: subscription.id,
        status: subscription.status as PaymentStatus,
        customerId: subscription.customer as string,
        priceId: priceItem.price.id,
        interval: (price.recurring?.interval as 'month' | 'year') || null,
        periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
      };
    } catch (error) {
      console.error('获取订阅失败:', error);
      return null;
    }
  }

  /**
   * 获取支付状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        return paymentIntent.status as PaymentStatus;
      } catch {
        const session = await stripe.checkout.sessions.retrieve(paymentId);
        return (session.payment_status || 'incomplete') as PaymentStatus;
      }
    } catch (error) {
      console.error('获取支付状态失败:', error);
      throw new Error('获取支付状态失败');
    }
  }

  /**
   * 验证 Webhook
   */
  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    try {
      stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
      return true;
    } catch (error) {
      console.error('Webhook 验证失败:', error);
      return false;
    }
  }

  /**
   * 构造 Webhook 事件
   */
  constructWebhookEvent(payload: string, signature: string) {
    return stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
  }
} 