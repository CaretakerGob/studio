
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { SheetTitle } from '@/components/ui/sheet';
import {
  Home,
  UserCircle,
  Dices,
  Layers,
  CalendarDays,
  Users as UsersIcon,
  Store,
  List,
  WandSparkles,
  Share2,
  User,
  HelpCircle,
  ShieldHalf,
  Gamepad2,
  ChevronDown,
  Lightbulb, // Added Lightbulb icon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean; // Added for greying out
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
      { href: '/shop', label: 'Whispers & Wares', icon: Store },
      { href: '/events', label: 'Item List', icon: List }, // Item List Page
      // AI Item Generator and NPC Generator moved from here
    ]
  },
  {
    label: 'Future Features', icon: Lightbulb, type: 'dropdown', children: [
      { href: '/item-generator', label: 'Item Generator (AI)', icon: WandSparkles, disabled: true },
      { href: '/investigations', label: 'NPC Generator', icon: UsersIcon, disabled: true },
    ]
  },
  { href: '/shared-space', label: 'Shared Space', icon: Share2, type: 'link' },
  { href: '/profile', label: 'User Profile', icon: User, type: 'link' },
  { href: '/faq', label: 'FAQ', icon: HelpCircle, type: 'link' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, open } = useSidebar();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Effect to open dropdown if a child is active and sidebar is open (desktop)
  useEffect(() => {
    if (!isMobile && open) {
      const newOpenDropdowns = { ...openDropdowns };
      let changed = false;
      navItemsConfig.forEach(item => {
        if (item.type === 'dropdown') {
          const isActiveParent = item.children.some(child => child.href === pathname);
          if (isActiveParent && !newOpenDropdowns[item.label]) {
            newOpenDropdowns[item.label] = true;
            changed = true;
          }
        }
      });
      if (changed) {
        setOpenDropdowns(newOpenDropdowns);
      }
    } else if (!open && !isMobile) {
      // Collapse all dropdowns if sidebar collapses on desktop
      setOpenDropdowns({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, open, isMobile]);


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
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <Link href={item.href} >
                    <item.icon className="h-5 w-5 text-sidebar-primary" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              ) : ( // Dropdown item
                <>
                  <SidebarMenuButton
                    onClick={() => setOpenDropdowns(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    isActive={item.children.some(child => child.href === pathname)}
                    tooltip={item.label}
                    className="justify-between w-full"
                    aria-expanded={openDropdowns[item.label]}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-sidebar-primary" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden",
                        openDropdowns[item.label] && "rotate-180"
                      )}
                    />
                  </SidebarMenuButton>
                  {openDropdowns[item.label] && !isMobile && open && (
                    <SidebarMenuSub>
                      {item.children.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                           <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.href && !subItem.disabled}
                              // Use aria-disabled for styling provided by ui/sidebar.tsx
                              aria-disabled={subItem.disabled}
                            >
                              <Link
                                href={subItem.disabled ? "#" : subItem.href}
                                onClick={(e) => { if (subItem.disabled) e.preventDefault(); }}
                                className={cn(
                                  subItem.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                              >
                                <subItem.icon className="h-4 w-4 text-sidebar-primary" />
                                <span>{subItem.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                   {openDropdowns[item.label] && isMobile && (
                     <div className="pl-7 flex flex-col gap-0.5 py-1 group-data-[collapsible=icon]:hidden">
                        {item.children.map((subItem) => (
                         <SidebarMenuSubItem key={subItem.href} className="p-0">
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.href && !subItem.disabled}
                              aria-disabled={subItem.disabled}
                              className="h-8"
                            >
                              <Link
                                href={subItem.disabled ? "#" : subItem.href}
                                onClick={(e) => { if (subItem.disabled) e.preventDefault(); }}
                                className={cn(
                                  subItem.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                              >
                                <subItem.icon className="h-4 w-4 text-sidebar-primary" />
                                <span>{subItem.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
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
