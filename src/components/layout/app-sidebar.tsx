
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react'; // Added useState
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,      // Added import
  SidebarMenuSubItem,  // Added import
  SidebarMenuSubButton,// Added import
  useSidebar,
} from '@/components/ui/sidebar';
import { SheetTitle } from '@/components/ui/sheet';
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
  ShieldHalf,
  Gamepad2,      // Added Gamepad2 icon
  ChevronDown,   // Added ChevronDown icon
} from 'lucide-react';
import { cn } from '@/lib/utils'; // For conditional class names

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface DropdownNavItem {
  label: string;
  icon: React.ElementType;
  type: 'dropdown';
  children: NavItem[];
}

type CombinedNavItem = NavItem & { type?: 'link' } | DropdownNavItem;

const navItemsConfig: CombinedNavItem[] = [
  { href: '/', label: 'Home', icon: Home, type: 'link' },
  { href: '/hunters-nexus', label: 'Hunter\'s Nexus', icon: ShieldHalf, type: 'link' },
  {
    label: 'Game Tools', icon: Gamepad2, type: 'dropdown', children: [
      { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
      { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
      { href: '/card-generator', label: 'Card Generator', icon: Layers },
      { href: '/item-list', label: 'Events', icon: CalendarDays }, // Event Generator
      { href: '/investigations', label: 'Investigations', icon: ClipboardList },
      { href: '/shop', label: 'Whispers & Wares', icon: Store },
      { href: '/events', label: 'Item List', icon: List }, // Item List Page
      { href: '/item-generator', label: 'Item Generator (AI)', icon: WandSparkles },
    ]
  },
  { href: '/shared-space', label: 'Shared Space', icon: Share2, type: 'link' },
  { href: '/profile', label: 'User Profile', icon: User, type: 'link' },
  { href: '/faq', label: 'FAQ', icon: HelpCircle, type: 'link' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const [isGameToolsOpen, setIsGameToolsOpen] = useState(false);

  const gameToolsChildrenPaths = navItemsConfig
    .find(item => item.type === 'dropdown' && item.label === 'Game Tools')
    // @ts-ignore
    ?.children.map(child => child.href) || [];
  const isGameToolsActive = gameToolsChildrenPaths.includes(pathname);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
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
          {navItemsConfig.map((item) => (
            <SidebarMenuItem key={item.label}>
              {item.type === 'link' ? (
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="justify-start"
                  >
                    <item.icon className="h-5 w-5 text-sidebar-primary" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              ) : ( // item.type === 'dropdown'
                <>
                  <SidebarMenuButton
                    onClick={() => setIsGameToolsOpen(!isGameToolsOpen)}
                    isActive={isGameToolsActive}
                    tooltip={item.label}
                    className="justify-between w-full" // Changed justify-start to justify-between for chevron
                    aria-expanded={isGameToolsOpen}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-sidebar-primary" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden",
                        isGameToolsOpen && "rotate-180"
                      )}
                    />
                  </SidebarMenuButton>
                  {isGameToolsOpen && !useSidebar().isMobile && ( // Sub-menu content for desktop
                    <SidebarMenuSub>
                      {item.children.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <Link href={subItem.href} passHref legacyBehavior>
                            <SidebarMenuSubButton
                              isActive={pathname === subItem.href}
                            >
                              <subItem.icon className="h-4 w-4 text-sidebar-primary" />
                              <span>{subItem.label}</span>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                   {/* For mobile, sub-items are rendered directly if parent is open */}
                   {isGameToolsOpen && useSidebar().isMobile && (
                     <div className="pl-7 flex flex-col gap-0.5 py-1 group-data-[collapsible=icon]:hidden">
                        {item.children.map((subItem) => (
                         <SidebarMenuSubItem key={subItem.href} className="p-0">
                           <Link href={subItem.href} passHref legacyBehavior>
                             <SidebarMenuSubButton
                               isActive={pathname === subItem.href}
                               className="h-8"
                             >
                               <subItem.icon className="h-4 w-4 text-sidebar-primary" />
                               <span>{subItem.label}</span>
                             </SidebarMenuSubButton>
                           </Link>
                         </SidebarMenuSubItem>
                       ))}
                     </div>
                   )}
                </>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
