import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as createSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup } from 'mime-types';
import sharp from 'sharp';
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2Client } from './r2-client';
import { fileRepository, type CreateFileData } from '@/server/db/repositories';

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  r2Key: string;
  thumbnailKey?: string;
  uploadUserId: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl?: string;
}

/**
 * 生成文件存储路径
 */
export function generateR2Key(
  filename: string,
  type: 'original' | 'thumbnail' = 'original'
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const prefix = type === 'thumbnail' ? 'thumbnails' : 'images';
  return `${prefix}/${year}/${month}/${filename}`;
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}.${ext}`;
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPEG、PNG、GIF、WebP 格式的图片' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }

  return { valid: true };
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * 获取图片元数据
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * 上传文件到 R2
 */
export async function uploadToR2(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await r2Client.send(command);
}

/**
 * 从 R2 删除文件
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * 生成文件访问 URL
 */
export function getFileUrl(r2Key: string): string {
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

/**
 * 生成预签名 URL（用于私有访问）
 */
export async function getSignedUrl(r2Key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
  });

  return createSignedUrl(r2Client, command, { expiresIn });
}

/**
 * 完整的文件上传流程（包括数据库操作）
 */
export async function uploadFile(file: File, userId: string): Promise<FileInfo> {
  // 验证文件
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 读取文件内容
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 获取图片元数据
  const { width, height } = await getImageMetadata(buffer);

  // 生成文件名和路径
  const filename = generateUniqueFilename(file.name);
  const r2Key = generateR2Key(filename);
  const thumbnailKey = generateR2Key(filename, 'thumbnail');

  // 生成缩略图
  const thumbnailBuffer = await generateThumbnail(buffer);

  // 上传原图到 R2
  await uploadToR2(r2Key, buffer, file.type);

  // 上传缩略图到 R2
  await uploadToR2(thumbnailKey, thumbnailBuffer, 'image/jpeg');

  // 保存文件信息到数据库
  const fileData: CreateFileData = {
    id: crypto.randomUUID(),
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    width,
    height,
    r2Key,
    thumbnailKey,
    uploadUserId: userId,
  };

  const fileInfo = await fileRepository.create(fileData);

  // 添加访问 URL
  return {
    ...fileInfo,
    url: getFileUrl(r2Key),
    thumbnailUrl: getFileUrl(thumbnailKey),
  };
}

/**
 * 删除文件（包括 R2 和数据库）
 */
export async function deleteFile(fileId: string, userId?: string): Promise<boolean> {
  // 从数据库获取文件信息
  const fileInfo = await fileRepository.findById(fileId);
  if (!fileInfo) {
    return false;
  }

  // 如果指定了用户ID，验证权限
  if (userId && fileInfo.uploadUserId !== userId) {
    throw new Error('无权删除此文件');
  }

  try {
    // 删除 R2 中的文件
    await deleteFromR2(fileInfo.r2Key);
    
    // 删除缩略图
    if (fileInfo.thumbnailKey) {
      await deleteFromR2(fileInfo.thumbnailKey);
    }

    // 从数据库删除记录
    const deleted = userId 
      ? await fileRepository.deleteByUserId(userId, fileId)
      : await fileRepository.delete(fileId);

    return deleted;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
}

/**
 * 获取文件列表（带分页）
 */
export async function getFileList(options: {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
}) {
  const { userId, ...listOptions } = options;

  if (userId) {
    const result = await fileRepository.findByUserId(userId, listOptions);
    return {
      files: result.files.map(file => ({
        ...file,
        url: getFileUrl(file.r2Key),
        thumbnailUrl: file.thumbnailKey ? getFileUrl(file.thumbnailKey) : undefined,
      })),
      pagination: {
        page: listOptions.page || 1,
        limit: listOptions.limit || 20,
        total: result.total,
      },
    };
  }
  
  const result = await fileRepository.findAll(listOptions);
  return {
    files: result.files.map(file => ({
      ...file,
      url: getFileUrl(file.r2Key),
      thumbnailUrl: file.thumbnailKey ? getFileUrl(file.thumbnailKey) : undefined,
    })),
    pagination: {
      page: listOptions.page || 1,
      limit: listOptions.limit || 20,
      total: result.total,
    },
  };
}

/**
 * 获取单个文件信息
 */
export async function getFileInfo(fileId: string): Promise<FileInfo | null> {
  const fileInfo = await fileRepository.findById(fileId);
  if (!fileInfo) {
    return null;
  }

  return {
    ...fileInfo,
    url: getFileUrl(fileInfo.r2Key),
    thumbnailUrl: fileInfo.thumbnailKey ? getFileUrl(fileInfo.thumbnailKey) : undefined,
  };
}
