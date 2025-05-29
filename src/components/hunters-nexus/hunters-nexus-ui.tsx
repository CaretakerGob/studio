
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Dices,
  Layers3,
  Users2,
  UserCircle2,
  Settings,
  LogOut,
  Dot,
  ChevronsRight,
  Heart,
  Brain,
  Footprints,
  Shield,
  UserMinus,
  UserPlus,
  BookOpen,
  Package, // Keep for potential future use, but not used now
  AlertCircle,
  Sword as MeleeIcon,
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { charactersData, type Character, type CharacterStats, type StatName } from '@/components/character-sheet/character-sheet-ui';
import { sampleDecks, type GameCard } from '@/components/card-generator/card-generator-ui';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// ArsenalCard type might still be useful if other Nexus features use it, but not for selected arsenal display
import type { ArsenalCard as ActualArsenalCard } from '@/types/arsenal';


interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string;
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

interface HuntersNexusUIProps {
  // arsenalCards: ActualArsenalCard[]; // Removed as per request
}

export function HuntersNexusUI({ }: HuntersNexusUIProps) { // Removed arsenalCards from props
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

  const [currentNexusHp, setCurrentNexusHp] = useState<number | null>(null);
  const [currentNexusSanity, setCurrentNexusSanity] = useState<number | null>(null);

  // Simplified effectiveNexusCharacterStats, no longer considers arsenals
  const effectiveNexusCharacterStats = useMemo(() => {
    if (!selectedNexusCharacter) {
      console.log("[Nexus UI] Memo: No selectedNexusCharacter for effectiveNexusCharacterStats.");
      return null;
    }
    console.log("[Nexus UI] Memo: Calculating effectiveNexusCharacterStats. Base Character:", selectedNexusCharacter?.name);
    const baseStats = { ...(selectedNexusCharacter.baseStats || { hp: 1, maxHp: 1, mv: 1, def: 1, sanity: 1, maxSanity: 1, meleeAttack: 0 }) };
    console.log("[Nexus UI] Final effectiveNexusCharacterStats (base only):", baseStats);
    return baseStats;
  }, [selectedNexusCharacter]);


  useEffect(() => {
    console.log("[Nexus UI] useEffect for HP/Sanity initialization triggered. Selected Character:", selectedNexusCharacter?.name);
    if (effectiveNexusCharacterStats) {
      console.log("[Nexus UI] Setting currentNexusHp and currentNexusSanity from effectiveNexusCharacterStats:", effectiveNexusCharacterStats);
      setCurrentNexusHp(effectiveNexusCharacterStats.maxHp);
      setCurrentNexusSanity(effectiveNexusCharacterStats.maxSanity);
    } else {
      console.log("[Nexus UI] No character selected or no effective stats, resetting HP/Sanity to null.");
      setCurrentNexusHp(null);
      setCurrentNexusSanity(null);
    }
  }, [selectedNexusCharacter, effectiveNexusCharacterStats]);


  const handleSelectCharacterForNexus = (character: Character) => {
    setSelectedNexusCharacter(character);
    setPartyMembers([character]);
    setIsCharacterSelectionDialogOpen(false);
    // No need to reset selectedCharacterArsenalId as it's removed
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

  const handleNexusStatChange = (stat: 'hp' | 'sanity', operation: 'increment' | 'decrement') => {
    if (!effectiveNexusCharacterStats) return;
    const delta = operation === 'increment' ? 1 : -1;

    const maxVal = stat === 'hp'
      ? effectiveNexusCharacterStats.maxHp
      : effectiveNexusCharacterStats.maxSanity;

    const setter = stat === 'hp' ? setCurrentNexusHp : setCurrentNexusSanity;

    setter(prevStatVal => {
      if (prevStatVal === null) return maxVal;
      const newValue = Math.max(0, Math.min(prevStatVal + delta, maxVal));
      return newValue;
    });
  };

  const getStatProgressColorClass = (current: number | null, max: number | undefined): string => {
    if (current === null || max === undefined || max === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (current / max) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Dot className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-semibold">Riddle of the Beast Companion</span>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <span className="text-sm text-muted-foreground">Room:</span>
          <span className="text-sm font-mono text-primary">BEAST_NEXUS</span>
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
        <Dialog open={isCharacterSelectionDialogOpen} onOpenChange={setIsCharacterSelectionDialogOpen}>
          <main className="flex-1 p-4 md:p-6 flex flex-col">
            <div
              className={cn(
                "flex-1 flex flex-col bg-card rounded-lg p-4 md:p-8 shadow-inner",
                selectedNexusCharacter ? "items-start justify-start" : "items-center justify-center"
              )}
            >
              {selectedNexusCharacter && effectiveNexusCharacterStats ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-primary">
                      <AvatarImage src={selectedNexusCharacter.imageUrl || `https://placehold.co/100x100.png?text=${selectedNexusCharacter.name.substring(0, 1)}`} alt={selectedNexusCharacter.name} data-ai-hint="selected character avatar" />
                      <AvatarFallback>{selectedNexusCharacter.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-primary">{selectedNexusCharacter.name}</h2>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">Change Character</Button>
                      </DialogTrigger>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border p-3 rounded-md bg-background/30 max-w-xs">
                    {currentNexusHp !== null && effectiveNexusCharacterStats.maxHp !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <Label className="flex items-center text-xs font-medium"><Heart className="mr-1.5 h-3 w-3 text-red-500" />HP</Label>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'decrement')} disabled={currentNexusHp === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                            <Input type="number" readOnly value={currentNexusHp} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'increment')} disabled={currentNexusHp === effectiveNexusCharacterStats.maxHp}><UserPlus className="h-2.5 w-2.5" /></Button>
                          </div>
                        </div>
                        <Progress value={(currentNexusHp / (effectiveNexusCharacterStats.maxHp || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusHp, effectiveNexusCharacterStats.maxHp))} />
                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusHp} / {effectiveNexusCharacterStats.maxHp}</p>
                      </div>
                    )}
                    {currentNexusSanity !== null && effectiveNexusCharacterStats.maxSanity !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <Label className="flex items-center text-xs font-medium"><Brain className="mr-1.5 h-3 w-3 text-blue-400" />Sanity</Label>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'decrement')} disabled={currentNexusSanity === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                            <Input type="number" readOnly value={currentNexusSanity} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'increment')} disabled={currentNexusSanity === effectiveNexusCharacterStats.maxSanity}><UserPlus className="h-2.5 w-2.5" /></Button>
                          </div>
                        </div>
                        <Progress value={(currentNexusSanity / (effectiveNexusCharacterStats.maxSanity || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusSanity, effectiveNexusCharacterStats.maxSanity))} />
                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusSanity} / {effectiveNexusCharacterStats.maxSanity}</p>
                      </div>
                    )}
                    <div className="flex items-center text-xs"><Footprints className="h-3 w-3 mr-1.5 text-green-500" /> MV: {effectiveNexusCharacterStats.mv}</div>
                    <div className="flex items-center text-xs"><Shield className="h-3 w-3 mr-1.5 text-gray-400" /> DEF: {effectiveNexusCharacterStats.def}</div>
                  </div>
                  {/* Arsenal Selector Removed */}
                </div>
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

          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Select Character for Nexus</DialogTitle>
              <DialogDescription>Choose a character template to use in this session.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-2">
                {charactersData.map((char) => (
                  <DialogClose asChild key={char.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => handleSelectCharacterForNexus(char)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={char.imageUrl || `https://placehold.co/40x40.png?text=${char.name.substring(0, 1)}`} alt={char.name} data-ai-hint="character avatar" />
                        <AvatarFallback>{char.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {char.name}
                    </Button>
                  </DialogClose>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

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
                        <Input id="nexusNumDice" type="number" value={nexusNumDice} onChange={(e) => setNexusNumDice(Math.max(1, parseInt(e.target.value) || 1))} className="h-8" />
                      </div>
                      <span className="pb-2">d</span>
                      <div className="flex-1">
                        <Label htmlFor="nexusDiceSides" className="text-xs">Sides</Label>
                        <Input id="nexusDiceSides" type="number" value={nexusDiceSides} onChange={(e) => setNexusDiceSides(Math.max(2, parseInt(e.target.value) || 2))} className="h-8" />
                      </div>
                      <Button onClick={handleNexusNumberedRoll} size="sm" className="h-8 px-2">
                        <ChevronsRight className="h-4 w-4" />
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
                          className="h-8" />
                      </div>
                      <Button onClick={handleNexusCombatRoll} size="sm" className="h-8 px-2">
                        <ChevronsRight className="h-4 w-4" />
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
                              {(nexusLatestRoll.rolls as number[]).map((roll, idx) => (
                                <Badge key={idx} variant="default" className="text-md bg-primary/20 text-primary-foreground border border-primary">
                                  {roll}
                                </Badge>
                              ))}
                            </div>
                            <p className="font-semibold text-primary">Total: {nexusLatestRoll.total}</p>
                          </>
                        )}
                        {nexusLatestRoll.type === 'combat' && (
                          <>
                            <div className="flex flex-wrap gap-0.5 justify-center mb-1">
                              {(nexusLatestRoll.rolls as CombatDieFace[]).map((roll, idx) => (
                                <CombatDieFaceImage key={idx} face={roll} size={24} />
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
                <CardHeader className="pb-2">
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
                          <SelectItem key={deck.name} value={deck.name} className="text-xs">
                            {deck.name} ({deck.cards.length} cards)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleNexusDrawCard} size="sm" className="w-full h-8 mt-2" disabled={!nexusSelectedDeckName}>
                      <BookOpen className="mr-2 h-4 w-4" /> Draw Card
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
                        <p className="font-semibold text-primary text-xs">{nexusLatestDrawnCard.name} <span className="text-xs text-muted-foreground">({nexusLatestDrawnCard.type})</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{nexusLatestDrawnCard.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
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
                            <AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.substring(0, 1)}`} alt={member.name} data-ai-hint="party member avatar" />
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
