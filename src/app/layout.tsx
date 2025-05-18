import type { Metadata } from 'next';
import { Open_Sans, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider

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
        <AuthProvider> {/* Wrap with AuthProvider */}
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarInset>
              <main className="p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </AuthProvider> {/* Close AuthProvider */}
      </body>
    </html>
  );
}
