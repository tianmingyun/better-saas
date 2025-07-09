import type { PaymentInterval } from '@/payment/types';

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: PaymentInterval;
  stripePriceId?: string;
  features: string[];
  popular?: boolean;
  metadata?: Record<string, string>;
  limits?: {
    storage?: number; // in GB
    users?: number;
    projects?: number;
    apiCalls?: number;
  };
}

export interface PaymentConfig {
  provider: 'stripe';
  currency: string;
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  plans: PaymentPlan[];
  trial: {
    enabled: boolean;
    days: number;
    plans: string[]; // plan IDs that support trial
  };
  invoice: {
    footer: string;
    logo?: string;
    supportEmail: string;
  };
  billing: {
    collectTaxId: boolean;
    allowPromotionCodes: boolean;
    automaticTax: boolean;
  };
  features: {
    subscriptions: boolean;
    oneTimePayments: boolean;
    invoices: boolean;
    customerPortal: boolean;
    webhooks: boolean;
  };
}

export const paymentConfig: PaymentConfig = {
  // Payment provider
  provider: 'stripe',
  
  // Base currency
  currency: 'usd',
  
  // Stripe configuration
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2025-06-30.basil',
  },

  // Subscription plans
  plans: [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      interval: null,
      features: [
        'Up to 3 projects',
        '5GB storage',
        'Basic support',
        'Community access',
        'Basic analytics',
      ],
      popular: false,
      limits: {
        storage: 5,
        users: 1,
        projects: 3,
        apiCalls: 1000,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for professionals',
      price: 29,
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      features: [
        'Unlimited projects',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'Team collaboration',
        'API access',
      ],
      popular: true,
      limits: {
        storage: 100,
        users: 5,
        projects: -1, // unlimited
        apiCalls: 50000,
      },
    },
    {
      id: 'pro-yearly',
      name: 'Pro (Yearly)',
      description: 'Best for professionals - Save 20%',
      price: 290,
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
      features: [
        'Unlimited projects',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'Team collaboration',
        'API access',
        '2 months free',
      ],
      popular: false,
      limits: {
        storage: 100,
        users: 5,
        projects: -1, // unlimited
        apiCalls: 50000,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: 99,
      interval: 'month',
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
      features: [
        'Unlimited everything',
        '1TB storage',
        '24/7 dedicated support',
        'Custom integrations',
        'Advanced security',
        'SLA guarantee',
        'On-premise deployment',
        'Custom training',
      ],
      popular: false,
      limits: {
        storage: 1000,
        users: -1, // unlimited
        projects: -1, // unlimited
        apiCalls: -1, // unlimited
      },
    },
  ],

  // Trial configuration
  trial: {
    enabled: true,
    days: 14,
    plans: ['pro', 'enterprise'], // Only these plans support trial
  },

  // Invoice configuration
  invoice: {
    footer: 'Thank you for your business! If you have any questions, please contact our support team.',
    logo: '/logo.png',
    supportEmail: 'support@better-saas.com',
  },

  // Billing configuration
  billing: {
    collectTaxId: true,
    allowPromotionCodes: true,
    automaticTax: true,
  },

  // Feature flags
  features: {
    subscriptions: true,
    oneTimePayments: true,
    invoices: true,
    customerPortal: true,
    webhooks: true,
  },
}; 