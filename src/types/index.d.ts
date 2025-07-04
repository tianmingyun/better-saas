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

