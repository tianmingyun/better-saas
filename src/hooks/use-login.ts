import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  useAuthLoading, 
  useAuthError, 
  useIsAuthenticated,
  useEmailLogin,
  useClearError,
  useSignInWithGithub,
  useSignInWithGoogle
} from '@/store/auth-store';
import type { LoginFormData, UseLoginReturn } from '@/types/login';
import { useToastMessages } from './use-toast-messages';

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastMessages = useToastMessages();
  
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const isAuthenticated = useIsAuthenticated();
  const emailLogin = useEmailLogin();
  const clearError = useClearError();
  const signInWithGithub = useSignInWithGithub();
  const signInWithGoogle = useSignInWithGoogle();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  // 获取回调URL
  const getRedirectUrl = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    return callbackUrl || '/settings/profile';
  }, [searchParams]);

  // 登录成功后自动跳转
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, getRedirectUrl]);

  // 处理社交登录
  const handleSocialLogin = async (provider: 'github' | 'google') => {
    try {
      clearError();   
      if (provider === 'github') {
        await signInWithGithub();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error('Social login error:', error);
      toastMessages.error.socialLoginFailed();
    }
  };

  // 处理邮箱登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); 

    const result = await emailLogin(formData.email, formData.password);
    if (result.success) {
      toastMessages.success.loginSuccess();
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    } else {
      toastMessages.error.loginFailed(result.error);
    }
  };

  // 清除错误
  const handleClearError = () => {
    clearError();
  };

  return {
    formData,
    setFormData,
    isLoading,
    error,
    isAuthenticated,
    handleEmailLogin,
    handleSocialLogin,
    handleClearError,
    getRedirectUrl,
  };
} 