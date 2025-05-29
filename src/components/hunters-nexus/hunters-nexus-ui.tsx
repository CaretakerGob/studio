
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Dices,
  Layers3,
  Users2,
  UserCircle2,
  Settings,
  LogOut,
  PlusCircle,
  Dot,
  ChevronsRight,
  Trash2,
  Copy,
  Edit3,
  Eye,
  Star,
  RefreshCw,
  BookOpen,
  Heart,
  Brain,
  Footprints,
  Shield,
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace, combatDieFaceImages } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { charactersData, type Character } from '@/components/character-sheet/character-sheet-ui'; // Import charactersData
import { sampleDecks, type GameCard } from '@/components/card-generator/card-generator-ui'; // Import sampleDecks and GameCard
import { useToast } from "@/hooks/use-toast";


interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string;
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

export function HuntersNexusUI() {
  const { toast } = useToast();
  const [nexusNumDice, setNexusNumDice] = useState(1);
  const [nexusDiceSides, setNexusDiceSides] = useState(6);
  const [nexusNumCombatDice, setNexusNumCombatDice] = useState(1);
  const [nexusLatestRoll, setNexusLatestRoll] = useState<NexusRollResult | null>(null);
  const [nexusRollKey, setNexusRollKey] = useState(0);

  const [selectedNexusCharacter, setSelectedNexusCharacter] = useState<Character | null>(null);
  const [isCharacterSelectionDialogOpen, setIsCharacterSelectionDialogOpen] = useState(false);
  const [partyMembers, setPartyMembers] = useState<Character[]>([]);

  const [nexusSelectedDeckName, setNexusSelectedDeckName] = useState<string | undefined>(undefined);
  const [nexusLatestDrawnCard, setNexusLatestDrawnCard] = useState<GameCard | null>(null);
  const [nexusCardKey, setNexusCardKey] = useState(0);


  const handleSelectCharacterForNexus = (character: Character) => {
    setSelectedNexusCharacter(character);
    setPartyMembers([character]);
    setIsCharacterSelectionDialogOpen(false);
    toast({ title: "Character Selected", description: `${character.name} is now active in the Nexus.` });
  };


  const handleNexusNumberedRoll = () => {
    if (nexusNumDice < 1 || nexusDiceSides < 2) {
      toast({ title: "Invalid Input", description: "Number of dice must be at least 1 and sides at least 2.", variant: "destructive" });
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
      toast({ title: "Invalid Input", description: "Number of combat dice must be between 1 and 12.", variant: "destructive" });
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

  const handleNexusDrawCard = () => {
    if (!nexusSelectedDeckName) {
      toast({ title: "No Deck Selected", description: "Please select a deck to draw from.", variant: "destructive" });
      return;
    }
    const deck = sampleDecks.find(d => d.name === nexusSelectedDeckName);
    if (!deck || deck.cards.length === 0) {
      toast({ title: "Deck Issue", description: `Could not find or draw from deck: ${nexusSelectedDeckName}.`, variant: "destructive" });
      return;
    }
    const randomIndex = Math.floor(Math.random() * deck.cards.length);
    const drawnCard = deck.cards[randomIndex];
    setNexusLatestDrawnCard(drawnCard);
    setNexusCardKey(prev => prev + 1);
    toast({ title: "Card Drawn!", description: `Drew ${drawnCard.name} from ${deck.name}.` });
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
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

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 md:p-6 flex flex-col bg-card/30">
          <div className="flex items-center gap-2 mb-4">
            {/* These buttons are placeholders for now, will link to sections in right sidebar or modals */}
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Dices className="mr-2 h-4 w-4" /> Roll Dice
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Layers3 className="mr-2 h-4 w-4" /> Draw Card
            </Button>
             <Dialog open={isCharacterSelectionDialogOpen} onOpenChange={setIsCharacterSelectionDialogOpen}>
                 {/* Trigger is part of conditional rendering below */}
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Character for Nexus</DialogTitle>
                    <DialogDescription>Choose a character template to use in this session.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] mt-4">
                    <div className="space-y-2">
                    {charactersData.map((char) => (
                        <Button
                        key={char.id}
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto"
                        onClick={() => handleSelectCharacterForNexus(char)}
                        >
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={char.imageUrl || `https://placehold.co/40x40.png?text=${char.name.substring(0,1)}`} alt={char.name} data-ai-hint="character avatar" />
                            <AvatarFallback>{char.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {char.name}
                        </Button>
                    ))}
                    </div>
                </ScrollArea>
                </DialogContent>
            </Dialog>
          </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-card rounded-lg p-4 md:p-8 shadow-inner">
              {selectedNexusCharacter ? (
                <>
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3 md:mb-4 border-4 border-primary">
                    <AvatarImage src={selectedNexusCharacter.imageUrl || `https://placehold.co/100x100.png?text=${selectedNexusCharacter.name.substring(0,1)}`} alt={selectedNexusCharacter.name} data-ai-hint="selected character avatar" />
                    <AvatarFallback>{selectedNexusCharacter.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl md:text-2xl font-semibold text-primary mb-1 md:mb-2">{selectedNexusCharacter.name}</h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 my-3 md:my-4 text-xs md:text-sm w-full max-w-md">
                    <div className="flex items-center justify-center p-2 bg-muted/30 rounded">
                      <Heart className="h-4 w-4 mr-1.5 text-red-500"/> HP: {selectedNexusCharacter.baseStats.hp}/{selectedNexusCharacter.baseStats.maxHp}
                    </div>
                    <div className="flex items-center justify-center p-2 bg-muted/30 rounded">
                      <Brain className="h-4 w-4 mr-1.5 text-blue-400"/> Sanity: {selectedNexusCharacter.baseStats.sanity}/{selectedNexusCharacter.baseStats.maxSanity}
                    </div>
                    <div className="flex items-center justify-center p-2 bg-muted/30 rounded">
                      <Footprints className="h-4 w-4 mr-1.5 text-green-500"/> MV: {selectedNexusCharacter.baseStats.mv}
                    </div>
                    <div className="flex items-center justify-center p-2 bg-muted/30 rounded">
                      <Shield className="h-4 w-4 mr-1.5 text-gray-400"/> DEF: {selectedNexusCharacter.baseStats.def}
                    </div>
                  </div>

                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Change Character</Button>
                  </DialogTrigger>
                </>
              ) : (
                <>
                  <UserCircle2 className="h-20 w-20 md:h-24 md:w-24 text-muted-foreground mb-3 md:mb-4" />
                  <h2 className="text-lg md:text-xl font-semibold text-muted-foreground">No Character Active</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">Choose a character to manage for this session.</p>
                  <DialogTrigger asChild>
                     <Button variant="default">Select Character</Button>
                  </DialogTrigger>
                </>
              )}
            </div>
        </main>

        <aside className="w-full md:w-80 lg:w-96 border-l border-border p-4 flex-shrink-0 overflow-y-auto bg-card/50">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Dices className="mr-2 h-5 w-5 text-primary" />
                    Dice Roller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Layers3 className="mr-2 h-5 w-5 text-primary" />
                    Card Decks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                    <Label htmlFor="nexusDeckSelect" className="text-sm">Select Deck</Label>
                    <Select value={nexusSelectedDeckName} onValueChange={setNexusSelectedDeckName}>
                      <SelectTrigger id="nexusDeckSelect" className="h-8">
                        <SelectValue placeholder="Choose a deck..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleDecks.map(deck => (
                          <SelectItem key={deck.name} value={deck.name}>
                            {deck.name} ({deck.cards.length} cards)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <Button onClick={handleNexusDrawCard} size="sm" className="w-full h-8 mt-2" disabled={!nexusSelectedDeckName}>
                        <BookOpen className="mr-2 h-4 w-4"/> Draw Card
                    </Button>
                  </div>
                  {nexusLatestDrawnCard && (
                    <Card key={nexusCardKey} className="mt-2 bg-muted/30 border-primary/50 shadow-sm animate-in fade-in duration-300">
                      <CardHeader className="p-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Latest Card Drawn:</span>
                           <Badge variant="secondary" className="text-xs">{nexusLatestDrawnCard.deck}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 text-left">
                        <p className="font-semibold text-primary">{nexusLatestDrawnCard.name} <span className="text-xs text-muted-foreground">({nexusLatestDrawnCard.type})</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{nexusLatestDrawnCard.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users2 className="mr-2 h-5 w-5 text-primary" />
                    Party Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {partyMembers.length === 0 && !selectedNexusCharacter ? (
                     <p className="text-sm text-muted-foreground">No character active in Nexus.</p>
                  ) : (
                    (selectedNexusCharacter ? [selectedNexusCharacter] : partyMembers).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.substring(0,1)}`} data-ai-hint="party member avatar" />
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

