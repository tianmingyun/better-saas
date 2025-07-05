'use server';

import { auth } from '@/lib/auth/auth';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { headers } from 'next/headers';
import { getErrorMessage } from './error-messages';

export async function uploadAvatarAction(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error(await getErrorMessage('unauthorizedAccess'));
    }

    const file = formData.get('avatar') as File;

    if (!file) {
      throw new Error(await getErrorMessage('fileNotFound'));
    }

    if (!file.type.startsWith('image/')) {
      throw new Error(await getErrorMessage('onlyImageFiles'));
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(await getErrorMessage('fileSizeLimit'));
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `avatar_${session.user.id}_${timestamp}.${extension}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    const filePath = join(uploadDir, filename);

    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);
    }

    const fileUrl = `/uploads/avatars/${filename}`;

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    throw new Error(
      error instanceof Error ? error.message : await getErrorMessage('fileUploadFailed')
    );
  }
} 