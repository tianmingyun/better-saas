import { env } from '@/env';
import { S3Client } from '@aws-sdk/client-s3';

// 只有当所有必需的 R2 环境变量都存在且非空时，才初始化 S3Client。
// 这里的条件判断确保了 env.R2_ENDPOINT, env.R2_ACCESS_KEY_ID, env.R2_SECRET_ACCESS_KEY
// 在传递给 S3Client 构造函数时，TypeScript 能够确定它们是 string 类型，
// 而不会是 string | undefined。
export const r2Client =
  env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: 'auto', // Cloudflare R2 常用 'auto'
        endpoint: env.R2_ENDPOINT,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      })
    : undefined; // 如果 R2 环境变量不完整，则 r2Client 为 undefined

// 对于 R2_BUCKET_NAME 和 R2_PUBLIC_URL，由于它们只是字符串赋值，
// 如果 env.ts 中已将它们设为 optional()，则它们的类型会是 string | undefined。
// 在使用它们的地方，同样需要进行空值检查。

export const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = env.R2_PUBLIC_URL;
