import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, Layers, UserCircle, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const features = [
    { name: "Character Sheet", href: "/character-sheet", icon: UserCircle, description: "Track your hero's stats and progress." },
    { name: "Dice Roller", href: "/dice-roller", icon: Dices, description: "Roll various dice for your game actions." },
    { name: "Card Generator", href: "/card-generator", icon: Layers, description: "Draw random cards from selected decks." },
    { name: "Turn Tracker", href: "/turn-tracker", icon: Users, description: "Manage player turns and game flow." },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4">Riddle of the Beast Companion</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your essential toolkit for navigating the horrors and challenges of the RotB board game. Dive in and enhance your gameplay experience!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {features.map((feature) => (
          <Card key={feature.name} className="shadow-xl hover:shadow-primary/50 transition-shadow duration-300">
            <CardHeader>
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

      <footer className="text-center mt-16 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} RotB Companion App. The Black Easter is coming!</p>
      </footer>
    </div>
  );
}
