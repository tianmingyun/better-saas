export interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }> | string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

export interface ProtectedSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  sidebarGroups: SidebarGroup[];
}

export interface ProtectedContainerProps {
  children: React.ReactNode;
  sidebarGroups: SidebarGroup[];
}

// Better Auth type extensions
declare module 'better-auth/types' {
  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
  }
}

