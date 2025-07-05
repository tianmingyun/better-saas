import { auth } from '@/lib/auth/auth';
import { deleteFile, getFileInfo } from '@/lib/file-service';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const fileInfo = await getFileInfo(id);

    if (!fileInfo) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 检查权限：只有文件所有者可以查看
    if (fileInfo.uploadUserId !== session.user.id) {
      return NextResponse.json({ error: '无权访问此文件' }, { status: 403 });
    }

    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return NextResponse.json(
      { error: '获取文件信息失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteFile(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文件失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '删除文件失败';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 