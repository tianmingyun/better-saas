import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/env';

// 服务端 Stripe 实例
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// 客户端 Stripe Promise
export const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Stripe 配置
export const stripeConfig = {
  publicKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  apiVersion: '2025-06-30.basil' as const,
}; 