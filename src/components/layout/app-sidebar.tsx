
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
import { Dices, Layers, UserCircle, Users, Home, Settings, PanelLeft, List } from 'lucide-react'; // Added List, Settings & PanelLeft

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
  { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
  { href: '/card-generator', label: 'Card Generator', icon: Layers },
  { href: '/turn-tracker', label: 'Turn Tracker', icon: Users },
  { href: '/item-list', label: 'Item List', icon: List },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {/* Beast Face Icon Removed */}
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
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {/* Optional Footer
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenuButton tooltip="Settings" className="justify-start">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarFooter>
      */}
    </Sidebar>
  );
}
