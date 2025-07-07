'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { getErrorMessage } from './error-messages';
import { uploadToR2, getFileUrl } from '@/lib/file-service';
import { generateUniqueFilename } from '@/lib/file-service';
import { ErrorLogger } from '@/lib/logger/logger-utils';

const avatarErrorLogger = new ErrorLogger('upload-avatar');

export async function uploadAvatarAction(formData: FormData) {
  let session: { user?: { id: string } } | null = null;
  let file: File | null = null;
  
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error(await getErrorMessage('unauthorizedAccess'));
    }

    file = formData.get('avatar') as File;

    if (!file) {
      throw new Error(await getErrorMessage('fileNotFound'));
    }

    if (!file.type.startsWith('image/')) {
      throw new Error(await getErrorMessage('onlyImageFiles'));
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(await getErrorMessage('fileSizeLimit'));
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成唯一文件名
    const filename = generateUniqueFilename(file.name);
    
    // 为头像创建专门的R2路径
    const r2Key = `avatars/${session.user.id}/${filename}`;

    // 上传到R2
    await uploadToR2(r2Key, buffer, file.type);

    // 生成访问URL
    const fileUrl = getFileUrl(r2Key);

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error) {
    avatarErrorLogger.logError(error as Error, {
      operation: 'uploadAvatar',
      userId: session?.user?.id,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });
    
    throw new Error(
      error instanceof Error ? error.message : await getErrorMessage('fileUploadFailed')
    );
  }
} 