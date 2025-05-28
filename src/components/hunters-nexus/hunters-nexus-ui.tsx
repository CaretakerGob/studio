
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dices,
  Layers3,
  Users2,
  UserCircle2,
  Settings,
  LogOut,
  PlusCircle,
  Dot
} from "lucide-react";

// Placeholder data - this would eventually come from a game session state
const partyMembers = [
  { id: "1", name: "Joshua", characterSelected: "No character selected", isOnline: true, avatarSeed: "joshua" },
  // { id: "2", name: "Maria", characterSelected: "Cassandra - The Oracle", isOnline: true, avatarSeed: "maria" },
  // { id: "3", name: "David", characterSelected: "Gob - The Tactician", isOnline: false, avatarSeed: "david" },
];

const recentRolls = [
  { id: "r1", roll: "d6", result: 4, user: "Joshua" },
  { id: "r2", roll: "d6", result: 2, user: "Joshua" },
];

const recentCards = [
  { id: "c1", name: "Blessed Shrine", type: "encounter", user: "Joshua" },
  { id: "c2", name: "Enchanted Bow", type: "loot", user: "Joshua" },
];

export function HuntersNexusUI() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* <img src="/path-to-your-logo.svg" alt="RotB Companion" className="h-6 w-6" /> */}
          <Dot className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-semibold">Riddle of the Beast Companion</span>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <span className="text-sm text-muted-foreground">Room:</span>
          <span className="text-sm font-mono text-primary">GE90BY</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Log Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left/Main Panel */}
        <main className="flex-1 p-4 md:p-6 flex flex-col bg-card/30">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Dices className="mr-2 h-4 w-4" /> Roll Dice
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Layers3 className="mr-2 h-4 w-4" /> Draw Card
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <UserCircle2 className="mr-2 h-4 w-4" /> Characters
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-card rounded-lg p-8 shadow-inner">
            <UserCircle2 className="h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground">No Character Selected</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose a character to start playing</p>
            <Button variant="default">Select Character</Button>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 border-l border-border p-4 flex-shrink-0 overflow-y-auto bg-card/50">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {/* Dice Roller Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Dices className="mr-2 h-5 w-5 text-primary" />
                    Dice Roller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((dice) => (
                      <div key={dice} className="flex items-center space-x-2">
                        <Checkbox id={`dice-${dice}`} />
                        <Label htmlFor={`dice-${dice}`} className="text-sm font-normal">{dice.toUpperCase()}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="text-center my-2">
                    <span className="text-5xl font-bold text-primary">2</span>
                    <p className="text-xs text-muted-foreground">d6</p>
                  </div>
                  <Button className="w-full">Roll Dice</Button>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Recent Rolls</h4>
                    <ScrollArea className="h-20 border rounded-md p-2">
                      {recentRolls.map(roll => (
                        <div key={roll.id} className="text-xs py-0.5">
                          <span className="font-semibold">{roll.roll.toUpperCase()}: {roll.result}</span> by <span className="text-primary/80">{roll.user}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Card Decks Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Layers3 className="mr-2 h-5 w-5 text-primary" />
                    Card Decks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">Loot Cards <span className="text-xs text-muted-foreground ml-1">- Weapons, armor, etc.</span></Button>
                  <Button variant="outline" className="w-full justify-start">Encounter Cards <span className="text-xs text-muted-foreground ml-1">- Events, enemies.</span></Button>
                  <div className="p-3 border rounded-md bg-muted/20">
                    <p className="font-semibold text-primary">Blessed Shrine</p>
                    <p className="text-xs text-muted-foreground">Restore all HP and remove one condition.</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">Drawn by Joshua</p>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">encounter</span>
                    </div>
                  </div>
                  <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Draw Card</Button>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Recent Cards</h4>
                    <ScrollArea className="h-20 border rounded-md p-2">
                      {recentCards.map(card => (
                        <div key={card.id} className="text-xs py-0.5 flex justify-between">
                          <div><span className="font-semibold">{card.name}</span> by <span className="text-primary/80">{card.user}</span></div>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/70 text-accent-foreground">{card.type}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Party Members Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users2 className="mr-2 h-5 w-5 text-primary" />
                    Party Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {partyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${member.name.substring(0,1)}`} data-ai-hint="user avatar" />
                          <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.characterSelected}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${member.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Invite Player</Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
