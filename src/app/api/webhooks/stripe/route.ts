import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { StripeProvider } from '@/lib/payment/stripe/provider';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import type Stripe from 'stripe';
import type { SubscriptionWithPeriod, InvoiceWithSubscription } from '@/types/stripe-extended';
import type { PaymentStatus } from '@/types/payment';

const stripeProvider = new StripeProvider();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 验证 webhook 签名
    const isValid = await stripeProvider.verifyWebhook(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 构造事件对象
    const event = stripeProvider.constructWebhookEvent(body, signature);

    // 检查事件是否已处理（避免重复处理）
    const isProcessed = await paymentRepository.isStripeEventProcessed(event.id);
    if (isProcessed) {
      console.log(`Event ${event.id} already processed`);
      return NextResponse.json({ received: true });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;

      case 'payment_method.attached':
        // 支付方式附加事件，通常不需要特殊处理
        console.log(`Payment method attached: ${event.data.object.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  try {
    console.log(`Checkout session completed: ${session.id}`);
    console.log('Session data:', JSON.stringify(session, null, 2));
    
    // 如果是订阅模式
    if (session.mode === 'subscription' && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const userId = session.metadata?.userId;
      
      if (!userId) {
        console.error('No userId found in session metadata');
        return;
      }

      // 获取 Stripe 订阅详情
      const { stripe } = await import('@/lib/payment/stripe/client');
      const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price']
      });
      
      // 类型断言为扩展类型
      const subscription = subscriptionResponse as unknown as SubscriptionWithPeriod;
      
      // 从订阅中获取价格ID
      const subscriptionItem = subscription.items.data[0];
      if (!subscriptionItem) {
        console.error('No subscription items found');
        return;
      }
      
      const priceId = subscriptionItem.price.id;
      const price = subscriptionItem.price;
      
      // 检查是否已经存在支付记录
      const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (existingRecord) {
        console.log(`Payment record already exists for subscription: ${subscriptionId}`);
        return;
      }
      
      // 创建支付记录
      await paymentRepository.create({
        id: subscriptionId,
        priceId: priceId,
        type: 'subscription',
        interval: (price.recurring?.interval as 'month' | 'year') || null,
        userId: userId,
        customerId: session.customer as string,
        subscriptionId: subscriptionId,
        status: subscription.status as PaymentStatus,
        periodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
        periodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // 记录事件
      await paymentRepository.createEvent({
        paymentId: subscriptionId,
        eventType: 'checkout.session.completed',
        stripeEventId: event.id,
        eventData: JSON.stringify(session),
      });

      console.log(`Subscription created from checkout: ${subscriptionId}`);
    }
    
    // 如果是一次性支付模式
    else if (session.mode === 'payment') {
      const paymentIntentId = session.payment_intent;
      const userId = session.metadata?.userId;
      
      if (!userId) {
        console.error('No userId found in session metadata');
        return;
      }

      // 从 line_items 获取价格信息
      const { stripe } = await import('@/lib/payment/stripe/client');
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price']
      });
      
      const lineItem = sessionWithLineItems.line_items?.data[0];
      if (!lineItem || !lineItem.price) {
        console.error('No line items or price found in session');
        return;
      }
      
      const priceId = lineItem.price.id;

      // 检查是否已经存在支付记录
      const existingRecord = await paymentRepository.findById(paymentIntentId as string);
      if (existingRecord) {
        console.log(`Payment record already exists for payment: ${paymentIntentId}`);
        return;
      }

      // 创建支付记录
      await paymentRepository.create({
        id: paymentIntentId as string,
        priceId: priceId,
        type: 'one_time',
        userId: userId,
        customerId: session.customer as string,
        status: 'active' as 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid',
      });

      // 记录事件
      await paymentRepository.createEvent({
        paymentId: paymentIntentId as string,
        eventType: 'checkout.session.completed',
        stripeEventId: event.id,
        eventData: JSON.stringify(session),
      });

      console.log(`One-time payment completed: ${paymentIntentId}`);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as SubscriptionWithPeriod;
  
  try {
    // 查找对应的支付记录
    const paymentRecord = await paymentRepository.findBySubscriptionId(subscription.id);
    
    if (!paymentRecord) {
      // 如果没有找到记录，可能是通过 Stripe Dashboard 创建的
      console.warn(`No payment record found for subscription ${subscription.id}`);
      return;
    }

    // 安全地处理时间戳转换
    const currentPeriodStart = subscription.current_period_start;
    const currentPeriodEnd = subscription.current_period_end;
    
    // 更新支付记录状态
    await paymentRepository.update(paymentRecord.id, {
      status: subscription.status as PaymentStatus,
      periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
      periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // 记录事件
    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'customer.subscription.created',
      stripeEventId: event.id,
      eventData: JSON.stringify(subscription),
    });

    console.log(`Subscription created: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as SubscriptionWithPeriod;
  
  try {
    const paymentRecord = await paymentRepository.findBySubscriptionId(subscription.id);
    if (!paymentRecord) {
      console.warn(`No payment record found for subscription ${subscription.id}`);
      return;
    }

    // 安全地处理时间戳转换
    const currentPeriodStart = subscription.current_period_start;
    const currentPeriodEnd = subscription.current_period_end;
    
    // 更新支付记录
    await paymentRepository.update(paymentRecord.id, {
      status: subscription.status as PaymentStatus,
      periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
      periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // 记录事件
    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'customer.subscription.updated',
      stripeEventId: event.id,
      eventData: JSON.stringify(subscription),
    });

    console.log(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  try {
    const paymentRecord = await paymentRepository.findBySubscriptionId(subscription.id);
    if (!paymentRecord) {
      console.warn(`No payment record found for subscription ${subscription.id}`);
      return;
    }

    // 更新支付记录状态为已取消
    await paymentRepository.update(paymentRecord.id, {
      status: 'canceled',
    });

    // 记录事件
    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'customer.subscription.deleted',
      stripeEventId: event.id,
      eventData: JSON.stringify(subscription),
    });

    console.log(`Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as InvoiceWithSubscription;
  
  try {
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (paymentRecord) {
        // 记录支付成功事件
        await paymentRepository.createEvent({
          paymentId: paymentRecord.id,
          eventType: 'invoice.payment_succeeded',
          stripeEventId: event.id,
          eventData: JSON.stringify(invoice),
        });

        console.log(`Invoice payment succeeded for subscription: ${subscriptionId}`);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as InvoiceWithSubscription;
  
  try {
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (paymentRecord) {
        // 记录支付失败事件
        await paymentRepository.createEvent({
          paymentId: paymentRecord.id,
          eventType: 'invoice.payment_failed',
          stripeEventId: event.id,
          eventData: JSON.stringify(invoice),
        });

        console.log(`Invoice payment failed for subscription: ${subscriptionId}`);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as InvoiceWithSubscription;
  
  try {
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (paymentRecord) {
        // 记录支付成功事件
        await paymentRepository.createEvent({
          paymentId: paymentRecord.id,
          eventType: 'invoice.paid',
          stripeEventId: event.id,
          eventData: JSON.stringify(invoice),
        });

        console.log(`Invoice paid for subscription: ${subscriptionId}`);
      }
    }
  } catch (error) {
    console.error('Error handling invoice paid:', error);
    throw error;
  }
} 