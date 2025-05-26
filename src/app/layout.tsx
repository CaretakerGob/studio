
import type { Metadata } from 'next';
import { Open_Sans, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Riddle of the Beast Companion',
  description: 'Your companion app for the Rotb board game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${openSans.variable} ${robotoMono.variable} antialiased`}>
        <AuthProvider>
          <SidebarProvider defaultOpen>
            {/* Mobile-only trigger button */}
            <div className="md:hidden fixed top-3 left-3 z-50">
              <SidebarTrigger asChild>
                <Button variant="outline" size="icon" className="shadow-md bg-background/80 hover:bg-accent border-primary text-primary">
                  <PanelLeft />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SidebarTrigger>
            </div>

            <AppSidebar />
            <SidebarInset className="p-4 md:p-6 lg:p-8">
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
