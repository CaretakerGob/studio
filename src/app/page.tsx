
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, Layers, UserCircle, List, CalendarDays, ClipboardList, Home, User, Share2, HelpCircle, FileText, ShieldCheckIcon, WandSparkles, Store, ShieldHalf, Gamepad2 } from "lucide-react";

export default function HomePage() {
  const features = [
    { name: "Hunter's Nexus", href: "/hunters-nexus", icon: ShieldHalf, description: "Access your session-based game hub." },
    { 
      name: "Game Tools", 
      href: "/character-sheet", // Link to a primary tool, others accessible via sidebar
      icon: Gamepad2, 
      description: "Access character sheets, dice, cards, event generators, and more." 
    },
    { name: "Shared Space", href: "/shared-space", icon: Share2, description: "Join or create a shared session." },
    { name: "User Profile", href: "/profile", icon: User, description: "Manage your profile and saved data." },
    // Individual tool links are removed from here, now accessible via "Game Tools" or the sidebar.
    // Example of one that was removed:
    // { name: "Character Sheet", href: "/character-sheet", icon: UserCircle, description: "Track your hero's stats and progress." },
  ];

  const footerLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "FAQs", href: "/faq", icon: HelpCircle },
    { name: "Terms of Service", href: "/terms", icon: FileText },
    { name: "Privacy Policy", href: "/privacy", icon: ShieldCheckIcon },
  ];

  const backgroundImageUrl = 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Web%20app%20images%2FScreenshot%202025-05-22%20172555.png?alt=media&token=1f1b444e-0eb3-476a-ad42-1167e4da8ba8';

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
      }}
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      data-ai-hint="dark fantasy background"
    >
      <div className="container mx-auto px-4 flex flex-col h-screen overflow-hidden md:min-h-screen md:py-6 md:overflow-visible relative z-10 bg-transparent py-4">
        <header className="text-center mb-4 bg-black/70 backdrop-blur-md p-3 rounded-lg shadow-xl flex-shrink-0 md:mb-6 md:p-6">
          <h1 className="text-3xl font-bold text-primary mb-2 md:text-5xl md:mb-4">Riddle of the Beast Companion</h1>
          <p className="text-md text-white max-w-2xl mx-auto md:text-xl">
            Your essential toolkit for navigating the horrors and challenges of the RotB board game. Dive in and enhance your gameplay experience!
          </p>
        </header>

        <div className="flex-grow overflow-y-auto flex flex-col space-y-4 py-2 md:py-0 
                        md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 
                        md:flex-grow-0 md:overflow-visible">
          {features.map((feature) => (
            <Card
              key={feature.name}
              className="w-full shadow-xl hover:shadow-primary/50 transition-shadow duration-300 flex flex-col bg-card/80 backdrop-blur-sm border-primary/30"
            >
              <CardHeader className="flex-grow p-4 md:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="h-6 w-6 text-primary md:h-8 md:w-8" />
                  <CardTitle className="text-lg md:text-2xl">{feature.name}</CardTitle>
                </div>
                <CardDescription className="text-card-foreground/80 text-sm md:text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <Link href={feature.href} passHref>
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Go to {feature.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <footer className="w-full py-4 mt-4 border-t border-border/30 text-center bg-black/70 backdrop-blur-md rounded-t-lg flex-shrink-0 md:py-6 md:mt-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {footerLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center justify-center sm:justify-start text-sm md:text-base">
                  <link.icon className="h-4 w-4 mr-2 shrink-0 md:h-5 md:w-5" />
                  {link.name}
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground md:text-sm">
              &copy; {new Date().getFullYear()} RotB Companion App. The Black Easter is coming!
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              This is the OFFICIAL Riddle of the Beast board game companion app and all associated properties are trademarks of their respective owners.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
