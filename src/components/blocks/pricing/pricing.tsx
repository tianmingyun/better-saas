'use client';

import { ArrowRight, CircleCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useIsAuthenticated } from '@/store/auth-store';
import { useRouter } from '@/i18n/navigation';
import { createCheckoutSession } from '@/server/actions/payment/create-subscription';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { ErrorLogger } from '@/lib/logger/logger-utils';
import { usePaymentPlans } from '@/hooks/use-config';

const pricingErrorLogger = new ErrorLogger('pricing');

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: PricingFeature[];
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  button: {
    text: string;
    url?: string; // Optional, for fallback
  };
}

interface Pricing2Props {
  heading?: string;
  description?: string;
  plans?: PricingPlan[];
}

const Pricing = ({
  heading = 'Pricing',
  description = 'Check out our affordable pricing plans',
  plans,
}: Pricing2Props) => {
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const paymentPlans = usePaymentPlans();
  
  // Use configured plans if not provided as props
  // Convert payment plans to pricing plans format if needed
  const pricingPlans = plans || paymentPlans.map((plan) => ({
    ...plan,
    monthlyPrice: plan.interval === 'month' ? `$${plan.price}` : `$${Math.round(plan.price / 12)}`,
    yearlyPrice: plan.interval === 'year' ? `$${Math.round(plan.price / 12)}` : `$${plan.price * 12}`,
    features: plan.features.map((feature: string) => ({ text: feature })),
    stripePriceIds: {
      monthly: plan.stripePriceId,
      yearly: plan.stripePriceId,
    },
    button: {
      text: plan.price === 0 ? 'Get Started' : 'Purchase',
    },
  }));

  const handlePurchaseClick = (plan: PricingPlan) => {
    if (!isAuthenticated) {
      // If user is not logged in, redirect to login page
      router.push('/login');
      return;
    }

    // Free plan redirects directly to dashboard
    if (plan.id === 'Free') {
      router.push('/dashboard');
      return;
    }

    // Get corresponding price ID
    const priceId = isYearly 
      ? plan.stripePriceIds?.yearly 
      : plan.stripePriceIds?.monthly;

    if (!priceId) {
      toast.error('价格配置错误，请联系客服');
      return;
    }

    // Create payment session
    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          priceId,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          // Redirect to billing page when user cancels payment, showing cancellation notice
          cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
        });

        if (result.success && result.data?.url) {
          window.location.href = result.data.url;
        } else {
          toast.error(result.error || '创建支付会话失败');
        }
      } catch (error) {
        toast.error('创建支付会话失败');
        pricingErrorLogger.logError(error as Error, {
          operation: 'createCheckoutSession',
          priceId,
          planId: plan.id,
        });
      }
    });
  };

  return (
    <section id="pricing" className="py-16">
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-pretty font-bold text-4xl lg:text-6xl">{heading}</h2>
          <p className="text-muted-foreground lg:text-xl">{description}</p>
          <div className="flex items-center gap-3 text-lg">
            Monthly
            <Switch checked={isYearly} onCheckedChange={() => setIsYearly(!isYearly)} />
            Yearly
          </div>
          <div className="flex flex-col items-stretch gap-6 md:flex-row">
            {pricingPlans.map((plan: PricingPlan) => (
              <Card key={plan.id} className="flex w-80 flex-col justify-between text-left">
                <CardHeader>
                  <CardTitle>
                    <p>{plan.name}</p>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <span className="font-bold text-4xl">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <p className="text-muted-foreground">
                    Billed{' '}
                    {isYearly
                      ? `$${Number(plan.yearlyPrice.slice(1)) * 12}`
                      : `$${Number(plan.monthlyPrice.slice(1)) * 12}`}{' '}
                    annually
                  </p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  {plan.id === 'pro' && (
                    <p className="mb-3 font-semibold">Everything in Plus, and:</p>
                  )}
                  <ul className="space-y-4">
                    {plan.features.map((feature: PricingFeature, index: number) => (
                      <li key={`${plan.id}-feature-${index}`} className="flex items-center gap-2">
                        <CircleCheck className="size-4" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchaseClick(plan)}
                    disabled={isPending}
                  >
                    {isPending ? '处理中...' : plan.button.text}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing };
