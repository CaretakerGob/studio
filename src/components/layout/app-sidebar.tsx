
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
import { Dices, Layers, UserCircle, Users, Home, Settings, PanelLeft } from 'lucide-react'; // Added Settings & PanelLeft

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/character-sheet', label: 'Character Sheet', icon: UserCircle },
  { href: '/dice-roller', label: 'Dice Roller', icon: Dices },
  { href: '/card-generator', label: 'Card Generator', icon: Layers },
  { href: '/turn-tracker', label: 'Turn Tracker', icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {/* You can replace this with a logo SVG or Image */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
            <path d="M11.248 2.544c.285-.488.919-.488 1.204 0l1.895 3.239c.09.154.253.25.43.261l3.51.173c.526.026.741.707.348 1.035l-2.73 2.218c-.132.107-.192.282-.156.449l.89 3.362c.132.498-.394.91-.836.606l-3.016-2.073c-.14-.096-.319-.096-.459 0l-3.016 2.073c-.442.304-.968-.108-.836-.606l.89-3.362c.036-.167-.024-.342-.156-.449l-2.73-2.218c-.393-.328-.178-1.009.348-1.035l3.51-.173c.177-.01.34-.107.43-.261l1.895-3.239zM6 18a1 1 0 00-1 1v1H4a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2H7v-1a1 1 0 00-1-1zm13-1a1 1 0 00-1-1h-1a1 1 0 100 2h1a1 1 0 001-1zm-5 2a1 1 0 100 2 1 1 0 000-2z"/>
          </svg>
          <span className="text-xl font-semibold text-sidebar-foreground">Beast Companion</span>
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
