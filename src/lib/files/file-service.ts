import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as createSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateThumbnail, getImageMetadata, validateImageFile } from './image-processor';
// 导入 r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL，它们的类型现在是 S3Client | undefined 和 string | undefined
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2Client } from './r2-client';
import { fileRepository, type CreateFileData } from '@/server/db/repositories';
import { ErrorLogger } from '@/lib/logger/logger-utils';

const fileServiceErrorLogger = new ErrorLogger('file-service');

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
  uploadUserEmail?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Generate file storage path
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
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}.${ext}`;
}

// 图像处理函数现在从 image-processor.ts 导入

/**
 * Upload file to R2
 */
export async function uploadToR2(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  // --- 重点修改：在调用 R2 客户端前进行检查 ---
  if (!r2Client || !R2_BUCKET_NAME) {
    fileServiceErrorLogger.logError(new Error('R2 client or bucket name is not configured.'), {
      operation: 'uploadToR2',
      key,
    });
    // 可以选择抛出错误，或者返回一个 Promise.reject，取决于你希望如何处理文件上传失败
    throw new Error('文件存储服务（R2）未配置，无法上传文件。');
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME, // TypeScript 现在知道 R2_BUCKET_NAME 是 string
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  // TypeScript 现在知道 r2Client 是 S3Client
  await r2Client.send(command);
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  // --- 重点修改：在调用 R2 客户端前进行检查 ---
  if (!r2Client || !R2_BUCKET_NAME) {
    fileServiceErrorLogger.logError(new Error('R2 client or bucket name is not configured.'), {
      operation: 'deleteFromR2',
      key,
    });
    // 可以选择抛出错误，或者静默返回，取决于你希望如何处理文件删除失败
    return; // 这里选择静默返回，因为删除失败可能不会影响核心功能
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME, // TypeScript 现在知道 R2_BUCKET_NAME 是 string
    Key: key,
  });

  // TypeScript 现在知道 r2Client 是 S3Client
  await r2Client.send(command);
}

/**
 * Generate file access URL
 */
export function getFileUrl(r2Key: string): string {
  // --- 重点修改：在使用 R2_PUBLIC_URL 前进行检查 ---
  if (!R2_PUBLIC_URL) {
    fileServiceErrorLogger.logError(new Error('R2 public URL is not configured.'), {
      operation: 'getFileUrl',
      r2Key,
    });
    // 返回一个占位符 URL 或抛出错误，取决于你希望如何处理公共 URL 不可用的情况
    return `/path/to/default-placeholder.png`; // 例如，返回一个默认图片占位符
  }
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

/**
 * Generate presigned URL (for private access)
 */
export async function getSignedUrl(r2Key: string, expiresIn = 3600): Promise<string> {
  // --- 重点修改：在调用 R2 客户端前进行检查 ---
  if (!r2Client || !R2_BUCKET_NAME) {
    fileServiceErrorLogger.logError(new Error('R2 client or bucket name is not configured.'), {
      operation: 'getSignedUrl',
      r2Key,
    });
    throw new Error('文件存储服务（R2）未配置，无法生成预签名 URL。');
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME, // TypeScript 现在知道 R2_BUCKET_NAME 是 string
    Key: r2Key,
  });

  // TypeScript 现在知道 r2Client 是 S3Client
  return createSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Complete file upload process (including database operations)
 */
export async function uploadFile(file: File, userId: string): Promise<FileInfo> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Read file content
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get image metadata
  const { width, height } = await getImageMetadata(buffer);

  // Generate filename and path
  const filename = generateUniqueFilename(file.name);
  const r2Key = generateR2Key(filename);
  const thumbnailKey = generateR2Key(filename, 'thumbnail');

  // Generate thumbnail
  const thumbnailBuffer = await generateThumbnail(buffer);

  // --- 重点修改：在调用 uploadToR2 前检查 R2 服务是否可用 ---
  // 这里可以再次检查 r2Client 是否存在，或者依赖 uploadToR2 内部的检查。
  // 最佳实践是，让低层函数负责检查，高层函数只处理其抛出的错误。
  await uploadToR2(r2Key, buffer, file.type);
  await uploadToR2(thumbnailKey, thumbnailBuffer, 'image/jpeg');

  // Save file info to database
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

  // Add access URL
  return {
    ...fileInfo,
    url: getFileUrl(r2Key),
    thumbnailUrl: thumbnailKey ? getFileUrl(thumbnailKey) : undefined,
  };
}

/**
 * Delete file (including R2 and database)
 */
export async function deleteFile(fileId: string, userId?: string): Promise<boolean> {
  // Get file info from database
  const fileInfo = await fileRepository.findById(fileId);
  if (!fileInfo) {
    return false;
  }

  // If user ID is specified, verify permissions
  if (userId && fileInfo.uploadUserId !== userId) {
    throw new Error('No permission to delete this file');
  }

  try {
    // --- 重点修改：在调用 deleteFromR2 前检查 R2 服务是否可用 ---
    // 同样，这里可以再次检查 r2Client 是否存在，或者依赖 deleteFromR2 内部的检查。
    await deleteFromR2(fileInfo.r2Key);

    // Delete thumbnail
    if (fileInfo.thumbnailKey) {
      await deleteFromR2(fileInfo.thumbnailKey);
    }

    // Delete record from database
    const deleted = userId
      ? await fileRepository.deleteByUserId(userId, fileId)
      : await fileRepository.delete(fileId);

    return deleted;
  } catch (error) {
    fileServiceErrorLogger.logError(error as Error, {
      operation: 'deleteFile',
      fileId,
      userId,
      r2Key: fileInfo.r2Key,
    });
    return false;
  }
}

/**
 * Get file list (with pagination)
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
 * Get single file info
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
