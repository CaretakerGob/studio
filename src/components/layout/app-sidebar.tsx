
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
          {/* Beast Face Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-9c.83 0 1.5-.67 1.5-1.5S10.33 8 9.5 8 8 8.67 8 9.5s.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 4c-1.48 0-2.75-.81-3.45-2H15.95c-.7 1.19-1.97 2-3.45 2zm-4.09-4.56c.1-.19.1-.41-.04-.59l-1.17-1.6c-.22-.3-.61-.38-.91-.18-.3.22-.38.61-.18.91l1.18 1.6c.15.2.38.29.59.29.08 0 .17-.02.23-.07zm8.18 0c.06.05.15.07.23.07.21 0 .44-.09.59-.29l1.18-1.6c.2-.3.12-.69-.18-.91-.3-.2-.69-.12-.91.18l-1.17 1.6c-.14.18-.14.41-.04.59z"/>
          </svg>
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
