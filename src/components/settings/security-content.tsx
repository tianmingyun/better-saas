'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function SecurityContent() {
  const t = useTranslations('security');
  const tCommon = useTranslations('common');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    try {
      // TODO: 实现重置密码逻辑
      console.log('Reset password');
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // TODO: 实现删除账户逻辑
      console.log('Delete account');
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl text-gray-900">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* Reset Password Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="font-medium text-gray-900 text-lg">
            {t('resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">{t('resetPassword.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-sm leading-relaxed">{t('resetPassword.description')}</p>
          <div className="flex justify-end">
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isResettingPassword ? tCommon('loading') : t('resetPassword.button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="border border-red-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="font-medium text-lg text-red-600">
            {t('deleteAccount.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">{t('deleteAccount.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-sm leading-relaxed">{t('deleteAccount.description')}</p>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-600 px-6 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isDeletingAccount ? tCommon('loading') : t('deleteAccount.button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
