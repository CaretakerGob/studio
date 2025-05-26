
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
  // SidebarTrigger, // No longer needed here for mobile
} from '@/components/ui/sidebar';
// import { Button } from '@/components/ui/button'; // No longer needed here for mobile trigger
import { Dices, Layers, UserCircle, Home, /* PanelLeft, */ List, CalendarDays, ClipboardList, User, Share2, WandSparkles, Store, HelpCircle, FileText, ShieldCheckIcon } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
  { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
  { href: '/card-generator', label: 'Card Generator', icon: Layers },
  { href: '/events', label: 'Item List', icon: List },
  { href: '/item-list', label: 'Events', icon: CalendarDays },
  { href: '/investigations', label: 'Investigations', icon: ClipboardList },
  { href: '/shop', label: 'Whispers & Wares', icon: Store },
  { href: '/item-generator', label: 'Item Generator (AI)', icon: WandSparkles },
  { href: '/shared-space', label: 'Shared Space', icon: Share2 },
  { href: '/profile', label: 'User Profile', icon: User },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {/* Removed icon here */}
          <span className="text-xl font-semibold text-sidebar-foreground">RotB Companion</span>
        </Link>
        {/* The mobile trigger is now in RootLayout.tsx */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
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
