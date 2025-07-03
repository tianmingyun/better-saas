'use client';

import { LanguageSwitcher } from '@/components/widget/language-switcher';
import { ThemeToggle } from '@/components/widget/theme-toggle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserAvatarMenu } from '@/components/widget/user-avatar-menu';
import { useAuthInitialized, useAuthLoading, useIsAuthenticated } from '@/store/auth-store';
import { Book, Menu, Sunset, Trees, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { JSX } from 'react';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: JSX.Element;
  items?: MenuItem[];
  onClick?: () => void;
}

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

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: {
      text: string;
      url: string;
    };
    signup: {
      text: string;
      url: string;
    };
  };
}

function DesktopAuthDisplay({
  loginText,
  loginUrl,
  signupText,
  signupUrl,
}: {
  loginText: string;
  loginUrl: string;
  signupText: string;
  signupUrl: string;
}) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isInitialized = useAuthInitialized();

  // Zustand ensure state remains consistent on both server side and client side.
  if (!isInitialized || isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (isAuthenticated) {
    return <UserAvatarMenu />;
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost">
        <Link href={loginUrl}>{loginText}</Link>
      </Button>
      <Button asChild>
        <Link href={signupUrl}>{signupText}</Link>
      </Button>
    </div>
  );
}

function MobileAuthDisplay({
  loginText,
  loginUrl,
  signupText,
  signupUrl,
}: {
  loginText: string;
  loginUrl: string;
  signupText: string;
  signupUrl: string;
}) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isInitialized = useAuthInitialized();

  // Keep the same loading state as the desktop side.
  if (!isInitialized || isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <UserAvatarMenu />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button asChild variant="ghost" className="w-full justify-start">
        <Link href={loginUrl}>{loginText}</Link>
      </Button>
      <Button asChild className="w-full justify-start">
        <Link href={signupUrl}>{signupText}</Link>
      </Button>
    </div>
  );
}

const Navbar = ({
  logo = {
    url: '/',
    src: '/icons/apple-touch-icon.png',
    alt: 'logo',
    title: 'Better SaaS',
  },
  menu,
  auth = {
    login: { text: 'Log in', url: '/login' },
    signup: { text: 'Sign up', url: '/signup' },
  },
}: NavbarProps) => {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

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

  const defaultMenu = [
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
          icon: <Zap className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          icon: <Sunset className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Status',
          description: 'Check the current status of our services and APIs',
          icon: <Trees className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Terms of Service',
          description: 'Our terms and conditions for using our services',
          icon: <Book className="size-5 shrink-0" />,
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

  const menuItems = menu || defaultMenu;
  return (
    <section className="py-2">
      <div className="container">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Link href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-8" alt={logo.alt} />
              <span className="font-semibold text-lg">{logo.title}</span>
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menuItems.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <DesktopAuthDisplay
              loginText={auth.login.text}
              loginUrl={auth.login.url}
              signupText={auth.signup.text}
              signupUrl={auth.signup.url}
            />
          </div>
        </nav>
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-8" alt={logo.alt} />
              <span className="font-semibold text-lg">{logo.title}</span>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className="flex items-center gap-2">
                      <img src={logo.src} className="w-8" alt={logo.alt} />
                      <span className="font-semibold text-lg">{logo.title}</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menuItems.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>
                  <MobileAuthDisplay
                    loginText={auth.login.text}
                    loginUrl={auth.login.url}
                    signupText={auth.signup.text}
                    signupUrl={auth.signup.url}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items && item.items.length > 0) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={subItem.url}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2 font-medium text-sm leading-none">
                      {subItem.icon}
                      {subItem.title}
                    </div>
                    <p className="line-clamp-2 text-muted-foreground text-sm leading-snug">
                      {subItem.description}
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild>
        <Link
          href={item.url}
          onClick={(e) => {
            if (item.onClick) {
              e.preventDefault();
              item.onClick();
            }
          }}
          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
        >
          {item.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items && item.items.length > 0) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-2 text-left">{item.title}</AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="grid gap-2">
            {item.items.map((subItem) => (
              <Link
                key={subItem.title}
                href={subItem.url}
                className="flex items-start gap-2 rounded-md p-2 hover:bg-accent"
              >
                {subItem.icon}
                <div>
                  <div className="font-medium text-sm">{subItem.title}</div>
                  {subItem.description && (
                    <div className="text-muted-foreground text-xs">{subItem.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <div key={item.title}>
      <Link
        href={item.url}
        onClick={(e) => {
          if (item.onClick) {
            e.preventDefault();
            item.onClick();
          }
        }}
        className="flex items-center rounded-md p-2 hover:bg-accent"
      >
        {item.title}
      </Link>
    </div>
  );
};

export { Navbar };
