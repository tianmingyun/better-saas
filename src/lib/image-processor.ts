/**
 * 跨平台图像处理器
 * 使用 jSquash 替代 sharp，支持 Vercel Serverless Functions、Edge Functions 和 Cloudflare Workers
 */

import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg';
import { decode as decodePng, encode as encodePng } from '@jsquash/png';
import resize from '@jsquash/resize';

export interface ImageMetadata {
  width: number;
  height: number;
}

/**
 * 检测图像格式
 */
function detectImageFormat(buffer: Buffer): 'jpeg' | 'png' | 'unknown' {
  const header = buffer.subarray(0, 8);
  
  // JPEG 格式检测 (FF D8 FF)
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'jpeg';
  }
  
  // PNG 格式检测 (89 50 4E 47 0D 0A 1A 0A)
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'png';
  }
  
  return 'unknown';
}

/**
 * 解码图像
 */
async function decodeImage(buffer: Buffer): Promise<ImageData> {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const format = detectImageFormat(buffer);
  
  try {
    switch (format) {
      case 'jpeg':
        return await decodeJpeg(arrayBuffer);
      case 'png':
        return await decodePng(arrayBuffer);
      default:
        // 如果格式检测失败，尝试所有支持的格式
        try {
          return await decodeJpeg(arrayBuffer);
        } catch {
          return await decodePng(arrayBuffer);
        }
    }
  } catch (error) {
    throw new Error(`无法解码图像: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成缩略图
 * 等价于 sharp(buffer).resize(300, 300, { fit: 'cover', position: 'center' }).jpeg({ quality: 80 }).toBuffer()
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  try {
    // 解码原图像
    const imageData = await decodeImage(buffer);
    
    // 调整大小 - 使用 contain 模式（保持宽高比）
    const resizedImageData = await resize(imageData, {
      width: 300,
      height: 300,
      fitMethod: 'contain' // 保持宽高比，填充空白
    });
    
    // 编码为 JPEG 格式，质量 80
    const encodedArrayBuffer = await encodeJpeg(resizedImageData, { quality: 80 });
    
    return Buffer.from(encodedArrayBuffer);
  } catch (error) {
    throw new Error(`生成缩略图失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取图像元数据
 * 等价于 sharp(buffer).metadata()
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    // 解码图像以获取尺寸信息
    const imageData = await decodeImage(buffer);
    
    return {
      width: imageData.width,
      height: imageData.height,
    };
  } catch (error) {
    throw new Error(`获取图像元数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证图像文件（更新支持的格式）
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 移除 webp 和 gif 支持，只保留 jpeg 和 png
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPEG、PNG 格式的图片' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }

  return { valid: true };
}

/**
 * 平台检测工具（可选，用于调试）
 */
export function detectPlatform(): 'vercel-serverless' | 'vercel-edge' | 'cloudflare-workers' | 'node' | 'unknown' {
  // Vercel Edge Runtime
  if (typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined') {
    return 'vercel-edge';
  }
  
  // Cloudflare Workers
  if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Cloudflare-Workers')) {
    return 'cloudflare-workers';
  }
  
  // Vercel Serverless Functions (Node.js 环境)
  if (typeof process !== 'undefined' && process.env.VERCEL) {
    return 'vercel-serverless';
  }
  
  // 普通 Node.js 环境
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  
  return 'unknown';
} 