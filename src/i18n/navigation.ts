import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 考虑路由配置的 Next.js 导航 API 的轻量级包装器
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing); 