
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, Layers, UserCircle, List, CalendarDays, ClipboardList, Home, User, Share2, HelpCircle, FileText, ShieldCheckIcon } from "lucide-react";

export default function HomePage() {
  const features = [
    { name: "Character Sheet", href: "/character-sheet", icon: UserCircle, description: "Track your hero's stats and progress." },
    { name: "Dice Roller", href: "/dice-roller", icon: Dices, description: "Roll various dice for your game actions." },
    { name: "Card Generator", href: "/card-generator", icon: Layers, description: "Draw random cards from selected decks." },
    { name: "Item List", href: "/events", icon: List, description: "View a list of items from the game." },
    { name: "Events", href: "/item-list", icon: CalendarDays, description: "Generate random events from game data." },
    { name: "Investigations", href: "/investigations", icon: ClipboardList, description: "Manage and track your investigations." },
    { name: "Shared Space", href: "/shared-space", icon: Share2, description: "Join or create a shared session." },
    { name: "User Profile", href: "/profile", icon: User, description: "Manage your profile and saved data." },
  ];

  const footerLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "FAQs", href: "/faq", icon: HelpCircle },
    { name: "Terms of Service", href: "/terms", icon: FileText },
    { name: "Privacy Policy", href: "/privacy", icon: ShieldCheckIcon },
  ];

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col min-h-screen">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4">Riddle of the Beast Companion</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your essential toolkit for navigating the horrors and challenges of the RotB board game. Dive in and enhance your gameplay experience!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-grow">
        {features.map((feature) => (
          <Card key={feature.name} className="shadow-xl hover:shadow-primary/50 transition-shadow duration-300 flex flex-col">
            <CardHeader className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">{feature.name}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={feature.href} passHref>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Go to {feature.name}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="w-full py-8 mt-16 border-t border-border text-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {footerLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center justify-center sm:justify-start">
                <link.icon className="h-5 w-5 mr-2 shrink-0" />
                {link.name}
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RotB Companion App. The Black Easter is coming!
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            This is the OFFICIAL Riddle of the Beast board game companion app and all associated properties are trademarks of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
