import { getLocale } from 'next-intl/server';

// Multi-language support for error messages in Server Actions
export async function getErrorMessage(key: string): Promise<string> {
  const locale = await getLocale();
  
  const messages = {
    zh: {
      unauthorizedAccess: '未授权访问',
      fileNotFound: '未找到文件',
      onlyImageFiles: '只允许上传图片文件',
      fileSizeLimit: '文件大小不能超过5MB',
      fileUploadFailed: '文件上传失败',
    },
    en: {
      unauthorizedAccess: 'Unauthorized access',
      fileNotFound: 'File not found',
      onlyImageFiles: 'Only image files are allowed',
      fileSizeLimit: 'File size cannot exceed 5MB',
      fileUploadFailed: 'File upload failed',
    },
  };

  const localeMessages = messages[locale as keyof typeof messages] || messages.en;
  return localeMessages[key as keyof typeof localeMessages] || key;
} 