import { auth } from '@/lib/auth/auth';
import { uploadFile } from '@/lib/file-service';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    const fileInfo = await uploadFile(file, session.user.id);

    return NextResponse.json({
      success: true,
      file: fileInfo,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '文件上传失败';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 