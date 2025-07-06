'use client';

import { LoginForm } from '@/components/blocks/login/login-form';
import { useLogin } from '@/hooks/use-login';
import { Suspense } from 'react';

function LoginPageContent() {
  const loginData = useLogin();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm 
          formData={loginData.formData}
          setFormData={loginData.setFormData}
          isLoading={loginData.isLoading}
          error={loginData.error}
          onEmailLogin={loginData.handleEmailLogin}
          onSocialLogin={loginData.handleSocialLogin}
          onClearError={loginData.handleClearError}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
