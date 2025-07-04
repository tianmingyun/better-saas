'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

export function ProfileContent() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const [name, setName] = useState('btcnoder');
  const [email, setEmail] = useState('btcnoder@gmail.com');
  const [selectedLanguage, setSelectedLanguage] = useState(locale === 'zh' ? 'zh' : 'en');

  const handleAvatarUpload = () => {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // 这里可以处理文件上传逻辑
        console.log('Selected file:', file);
      }
    };
    input.click();
  };

  const handleSaveName = () => {
    // 保存姓名逻辑
    console.log('Saving name:', name);
  };

  const handleSaveEmail = () => {
    // 保存邮箱逻辑
    console.log('Saving email:', email);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6">
        {/* 头像设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('avatar.title')}</CardTitle>
            <CardDescription>{t('avatar.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback className="text-lg">BT</AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="-bottom-2 -right-2 absolute h-8 w-8 rounded-full p-0"
                  onClick={handleAvatarUpload}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 语言设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('language.title')}</CardTitle>
            <CardDescription>{t('language.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t('language.label')}</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 姓名设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('name.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('name.placeholder')}
                />
              </div>
              <Button onClick={handleSaveName} variant="outline">
                {t('save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 邮箱设置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('email.title')}</CardTitle>
            <CardDescription>{t('email.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email.placeholder')}
                />
              </div>
              <Button onClick={handleSaveEmail} variant="outline">
                {t('save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
