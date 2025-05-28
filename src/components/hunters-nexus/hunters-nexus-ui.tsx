
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dices,
  Layers3,
  Users2,
  UserCircle2,
  Settings,
  LogOut,
  PlusCircle,
  Dot,
  ChevronsRight
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace, combatDieFaceImages } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Placeholder data - this would eventually come from a game session state
const partyMembers = [
  { id: "1", name: "Joshua", characterSelected: "No character selected", isOnline: true, avatarSeed: "joshua" },
];

interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string; // Number for numbered, string summary for combat
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

export function HuntersNexusUI() {
  // State for embedded dice roller
  const [nexusNumDice, setNexusNumDice] = useState(1);
  const [nexusDiceSides, setNexusDiceSides] = useState(6);
  const [nexusNumCombatDice, setNexusNumCombatDice] = useState(1);
  const [nexusLatestRoll, setNexusLatestRoll] = useState<NexusRollResult | null>(null);
  const [nexusRollKey, setNexusRollKey] = useState(0);


  const handleNexusNumberedRoll = () => {
    if (nexusNumDice < 1 || nexusDiceSides < 2) {
      alert("Number of dice must be at least 1 and sides at least 2.");
      return;
    }
    const rolls: number[] = [];
    let total = 0;
    for (let i = 0; i < nexusNumDice; i++) {
      const roll = Math.floor(Math.random() * nexusDiceSides) + 1;
      rolls.push(roll);
      total += roll;
    }
    setNexusLatestRoll({
      type: 'numbered',
      notation: `${nexusNumDice}d${nexusDiceSides}`,
      rolls,
      total,
    });
    setNexusRollKey(prev => prev + 1);
  };

  const handleNexusCombatRoll = () => {
    if (nexusNumCombatDice < 1 || nexusNumCombatDice > 12) {
      alert("Number of combat dice must be between 1 and 12.");
      return;
    }
    const rolls: CombatDieFace[] = [];
    const faceCounts: Record<CombatDieFace, number> = { swordandshield: 0, 'double-sword': 0, blank: 0 };

    for (let i = 0; i < nexusNumCombatDice; i++) {
      const rollIndex = Math.floor(Math.random() * 6);
      const face = combatDieFaces[rollIndex];
      rolls.push(face);
      faceCounts[face]++;
    }
    const summary = `S&S: ${faceCounts.swordandshield}, DS: ${faceCounts['double-sword']}, Blk: ${faceCounts.blank}`;
    setNexusLatestRoll({
      type: 'combat',
      notation: `${nexusNumCombatDice}x Combat Dice`,
      rolls,
      total: summary,
    });
    setNexusRollKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Dices className="mr-2 h-5 w-5 text-primary" />
                    Dice Roller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Numbered Dice */}
                  <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                    <Label className="text-sm">Numbered Dice</Label>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="nexusNumDice" className="text-xs">Qty</Label>
                        <Input id="nexusNumDice" type="number" value={nexusNumDice} onChange={(e) => setNexusNumDice(Math.max(1, parseInt(e.target.value) || 1))} className="h-8"/>
                      </div>
                      <span className="pb-2">d</span>
                      <div className="flex-1">
                         <Label htmlFor="nexusDiceSides" className="text-xs">Sides</Label>
                        <Input id="nexusDiceSides" type="number" value={nexusDiceSides} onChange={(e) => setNexusDiceSides(Math.max(2, parseInt(e.target.value) || 2))} className="h-8"/>
                      </div>
                      <Button onClick={handleNexusNumberedRoll} size="sm" className="h-8 px-2">
                        <ChevronsRight className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                  {/* Combat Dice */}
                  <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                    <Label className="text-sm">Combat Dice</Label>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="nexusNumCombatDice" className="text-xs">Qty (1-12)</Label>
                        <Input id="nexusNumCombatDice" type="number" value={nexusNumCombatDice} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setNexusNumCombatDice(Math.max(1, Math.min(12, val)));
                          }} 
                          className="h-8"/>
                      </div>
                      <Button onClick={handleNexusCombatRoll} size="sm" className="h-8 px-2">
                        <ChevronsRight className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                  {/* Latest Roll Display within Nexus */}
                  {nexusLatestRoll && (
                    <Card key={nexusRollKey} className="mt-2 bg-muted/30 border-primary/50 shadow-sm animate-in fade-in duration-300">
                      <CardHeader className="p-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Latest Roll:</span>
                          <Badge variant="secondary" className="text-xs">{nexusLatestRoll.notation}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 text-center">
                        {nexusLatestRoll.type === 'numbered' && (
                          <>
                            <div className="flex flex-wrap gap-1 justify-center mb-1">
                              {nexusLatestRoll.rolls.map((roll, idx) => (
                                <Badge key={idx} variant="default" className="text-md bg-primary/20 text-primary-foreground border border-primary">
                                  {roll as number}
                                </Badge>
                              ))}
                            </div>
                            <p className="font-semibold text-primary">Total: {nexusLatestRoll.total}</p>
                          </>
                        )}
                        {nexusLatestRoll.type === 'combat' && (
                          <>
                            <div className="flex flex-wrap gap-0.5 justify-center mb-1">
                              {nexusLatestRoll.rolls.map((roll, idx) => (
                                <CombatDieFaceImage key={idx} face={roll as CombatDieFace} size={24} />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{nexusLatestRoll.total as string}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Card Decks Section (Placeholder) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Layers3 className="mr-2 h-5 w-5 text-primary" />
                    Card Decks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select deck..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event Deck</SelectItem>
                      <SelectItem value="item">Item Deck</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Draw Card</Button>
                  <div className="p-3 border rounded-md bg-muted/20">
                    <p className="font-semibold text-primary">Placeholder Card</p>
                    <p className="text-xs text-muted-foreground">Card description here.</p>
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
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", member.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400')}>
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

