
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { SheetTitle } from '@/components/ui/sheet'; // Ensure SheetTitle is imported
import {
  Home,
  UserCircle,
  Dices,
  Layers,
  CalendarDays,
  ClipboardList,
  Store,
  List,
  WandSparkles,
  Share2,
  User,
  HelpCircle,
  ShieldHalf
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
  { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
  { href: '/card-generator', label: 'Card Generator', icon: Layers },
  { href: '/item-list', label: 'Events', icon: CalendarDays },
  { href: '/investigations', label: 'Investigations', icon: ClipboardList },
  { href: '/shop', label: 'Whispers & Wares', icon: Store },
  { href: '/events', label: 'Item List', icon: List },
  { href: '/item-generator', label: 'Item Generator (AI)', icon: WandSparkles },
  { href: '/hunters-nexus', label: 'Hunter\'s Nexus', icon: ShieldHalf },
  { href: '/shared-space', label: 'Shared Space', icon: Share2 },
  { href: '/profile', label: 'User Profile', icon: User },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar(); // Get mobile status

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {/* Conditional SheetTitle for mobile view only */}
          {isMobile ? (
            <SheetTitle asChild>
              <span className="text-xl font-semibold text-sidebar-foreground">RotB Companion</span>
            </SheetTitle>
          ) : (
            <span className="text-xl font-semibold text-sidebar-foreground">RotB Companion</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href + '_' + item.label}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5 text-sidebar-primary" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
