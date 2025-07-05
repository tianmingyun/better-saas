import { useParams, useRouter } from 'next/navigation';
import { useAuthInitialized, useAuthLoading, useIsAuthenticated } from '@/store/auth-store';
import type { UseNavbarReturn, LogoConfig, AuthConfig, MenuItem } from '@/types/navbar';

export function useNavbar(): UseNavbarReturn {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isInitialized = useAuthInitialized();

  // Logo配置
  const logo: LogoConfig = {
    url: '/',
    src: '/icons/apple-touch-icon.png',
    alt: 'logo',
    title: 'Better SaaS',
  };

  // 认证配置
  const auth: AuthConfig = {
    login: { text: 'Log in', url: '/login' },
    signup: { text: 'Sign up', url: '/signup' },
  };

  // 平滑滚动到指定元素的函数
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // 处理定价点击事件
  const handlePricingClick = () => {
    const currentPath = window.location.pathname;
    const homePath = `/${locale}`;

    if (currentPath === homePath || currentPath === `${homePath}/`) {
      scrollToElement('pricing');
    } else {
      router.push(`${homePath}#pricing`);
      setTimeout(() => {
        scrollToElement('pricing');
      }, 100);
    }
  };

  // 菜单配置 (图标将在组件中创建)
  const menu: MenuItem[] = [
    { title: 'Blog', url: `/${locale}/blog` },
    {
      title: 'Document',
      url: `/${locale}/docs`,
    },
    {
      title: 'Components',
      url: `/${locale}/blocks`,
    },
    {
      title: 'Resources',
      url: '#',
      items: [
        {
          title: 'Help Center',
          description: 'Get all the answers you need right here',
          url: '#',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          url: '#',
        },
        {
          title: 'Status',
          description: 'Check the current status of our services and APIs',
          url: '#',
        },
        {
          title: 'Terms of Service',
          description: 'Our terms and conditions for using our services',
          url: '#',
        },
      ],
    },
    {
      title: 'Pricing',
      url: `/${locale}#pricing`,
      onClick: handlePricingClick,
    },
  ];

  return {
    logo,
    menu,
    auth,
    locale,
    isAuthenticated,
    isLoading,
    isInitialized,
    handlePricingClick,
  };
} 