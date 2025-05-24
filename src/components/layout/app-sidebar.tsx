
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Dices, Layers, UserCircle, Home, PanelLeft, List, CalendarDays, ClipboardList, User, Share2, WandSparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
  { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
  { href: '/card-generator', label: 'Card Generator', icon: Layers },
  { href: '/events', label: 'Item List', icon: List },
  { href: '/item-list', label: 'Events', icon: CalendarDays },
  { href: '/investigations', label: 'Investigations', icon: ClipboardList },
  { href: '/item-generator', label: 'Item Generator (AI)', icon: WandSparkles },
  { href: '/shared-space', label: 'Shared Space', icon: Share2 },
  { href: '/profile', label: 'User Profile', icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <span className="text-xl font-semibold text-sidebar-foreground">RotB Companion</span>
        </Link>
        <SidebarTrigger asChild className="md:hidden">
           <Button variant="ghost" size="icon"><PanelLeft /></Button>
        </SidebarTrigger>
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
