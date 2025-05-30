
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
  Sword as MeleeIcon,
  UserMinus,
  UserPlus,
  BookOpen,
  Package,
  AlertCircle,
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { charactersData, type Character, type CharacterStats, type StatName } from '@/components/character-sheet/character-sheet-ui';
import { sampleDecks, type GameCard } from '@/components/card-generator/card-generator-ui';
import { GameCardDisplay } from '@/components/card-generator/game-card-display';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ArsenalCard as ActualArsenalCard, ArsenalItem } from '@/types/arsenal';

interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string;
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];
const faceTypeLabels: Record<CombatDieFace, string> = {
  swordandshield: 'Sword & Shield',
  'double-sword': 'Double Sword',
  blank: 'Blank',
};

const MIN_SWIPE_DISTANCE = 50;
const MAX_TAP_MOVEMENT = 10;

interface HuntersNexusUIProps {
  arsenalCards: ActualArsenalCard[];
}

export function HuntersNexusUI({ arsenalCards }: HuntersNexusUIProps) {
  const { toast } = useToast();
  const [nexusNumDice, setNexusNumDice] = useState(1);
  const [nexusDiceSides, setNexusDiceSides] = useState(6);
  const [nexusNumCombatDice, setNexusNumCombatDice] = useState(1);
  const [nexusLatestRoll, setNexusLatestRoll] = useState<NexusRollResult | null>(null);
  const [nexusRollKey, setNexusRollKey] = useState(0);

  const [selectedNexusCharacter, setSelectedNexusCharacter] = useState<Character | null>(null);
  const [isCharacterSelectionDialogOpen, setIsCharacterSelectionDialogOpen] = useState(false);
  const [partyMembers, setPartyMembers] = useState<Character[]>([]);

  const [nexusDrawnCardsHistory, setNexusDrawnCardsHistory] = useState<GameCard[]>([]);
  const [nexusSelectedDeckName, setNexusSelectedDeckName] = useState<string | undefined>(undefined);
  const [nexusCardKey, setNexusCardKey] = useState(0);
  
  const [currentNexusHp, setCurrentNexusHp] = useState<number | null>(null);
  const [currentNexusSanity, setCurrentNexusSanity] = useState<number | null>(null);
  const [currentNexusMv, setCurrentNexusMv] = useState<number | null>(null);
  const [currentNexusDef, setCurrentNexusDef] = useState<number | null>(null);
  
  const [selectedCharacterArsenalId, setSelectedCharacterArsenalId] = useState<string | null>(null);
  const criticalArsenalError = useMemo(() => arsenalCards.find(card => card.id === 'error-critical-arsenal'), [arsenalCards]);

  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const currentNexusArsenal = useMemo(() => {
    if (!selectedCharacterArsenalId || !arsenalCards || arsenalCards.length === 0) return null;
    const card = arsenalCards.find(card => card.id === selectedCharacterArsenalId);
    if (!card || card.id.startsWith('error-')) return null;
    return card;
  }, [selectedCharacterArsenalId, arsenalCards]);

  const effectiveNexusCharacterStats: CharacterStats | null = useMemo(() => {
    console.log("[Nexus UI] Memo: Recalculating effectiveNexusCharacterStats. Selected Character:", selectedNexusCharacter?.name, "Equipped Arsenal:", currentNexusArsenal?.name);
    if (!selectedNexusCharacter) {
      console.log("[Nexus UI] Memo: No selectedNexusCharacter for effectiveNexusCharacterStats.");
      return null;
    }

    let calculatedStats: CharacterStats = JSON.parse(JSON.stringify(selectedNexusCharacter.baseStats || { hp: 1, maxHp: 1, mv: 1, def: 1, sanity: 1, maxSanity: 1, meleeAttack: 0 }));

    if (currentNexusArsenal) {
      console.log(`[Nexus UI] Applying GLOBAL arsenal modifiers from: ${currentNexusArsenal.name}`, currentNexusArsenal);
      calculatedStats.hp = (calculatedStats.hp || 0) + (currentNexusArsenal.hpMod || 0);
      calculatedStats.maxHp = (calculatedStats.maxHp || 1) + (currentNexusArsenal.maxHpMod || 0);
      calculatedStats.mv = (calculatedStats.mv || 0) + (currentNexusArsenal.mvMod || 0);
      calculatedStats.def = (calculatedStats.def || 0) + (currentNexusArsenal.defMod || 0);
      calculatedStats.sanity = (calculatedStats.sanity || 0) + (currentNexusArsenal.sanityMod || 0);
      calculatedStats.maxSanity = (calculatedStats.maxSanity || 1) + (currentNexusArsenal.maxSanityMod || 0);
      calculatedStats.meleeAttack = (calculatedStats.meleeAttack || 0) + (currentNexusArsenal.meleeAttackMod || 0);
      
      if (currentNexusArsenal.items) {
        currentNexusArsenal.items.forEach(item => {
          if (item.category?.toUpperCase() === 'GEAR' && item.parsedStatModifiers) {
             console.log(`[Nexus UI] Item '${item.abilityName}' is GEAR. Parsed Modifiers:`, JSON.stringify(item.parsedStatModifiers));
            item.parsedStatModifiers.forEach(mod => {
              const statKey = mod.targetStat as keyof CharacterStats;
              if (statKey in calculatedStats && typeof (calculatedStats[statKey]) === 'number') {
                 console.log(`[Nexus UI] APPLYING GEAR MODS for ${item.abilityName}: ${statKey} by ${mod.value}`);
                (calculatedStats[statKey] as number) = (calculatedStats[statKey] as number) + mod.value;
              } else {
                console.warn(`[Nexus UI] GEAR item ${item.abilityName} tried to modify unknown stat '${statKey}' or stat was not a number.`);
              }
            });
          }
        });
      }
    }

    calculatedStats.hp = Math.max(0, calculatedStats.hp);
    calculatedStats.maxHp = Math.max(1, calculatedStats.maxHp);
    calculatedStats.mv = Math.max(0, calculatedStats.mv);
    calculatedStats.def = Math.max(0, calculatedStats.def);
    calculatedStats.sanity = Math.max(0, calculatedStats.sanity);
    calculatedStats.maxSanity = Math.max(1, calculatedStats.maxSanity);
    calculatedStats.meleeAttack = Math.max(0, calculatedStats.meleeAttack || 0);

    if (calculatedStats.hp > calculatedStats.maxHp) calculatedStats.hp = calculatedStats.maxHp;
    if (calculatedStats.sanity > calculatedStats.maxSanity) calculatedStats.sanity = calculatedStats.maxSanity;

    console.log("[Nexus UI] Final effectiveNexusCharacterStats:", calculatedStats);
    return calculatedStats;
  }, [selectedNexusCharacter, currentNexusArsenal]);

  useEffect(() => {
    console.log("[Nexus UI] useEffect for HP/Sanity initialization triggered. Selected Character:", selectedNexusCharacter?.name, "Effective Stats:", effectiveNexusCharacterStats);
    if (effectiveNexusCharacterStats) {
      console.log("[Nexus UI] Setting currentNexusHp and currentNexusSanity from effectiveNexusCharacterStats:", effectiveNexusCharacterStats);
      setCurrentNexusHp(effectiveNexusCharacterStats.maxHp);
      setCurrentNexusSanity(effectiveNexusCharacterStats.maxSanity);
      setCurrentNexusMv(effectiveNexusCharacterStats.mv);
      setCurrentNexusDef(effectiveNexusCharacterStats.def);
    } else {
      console.log("[Nexus UI] No character selected or no effective stats, resetting HP/Sanity/MV/DEF to null.");
      setCurrentNexusHp(null);
      setCurrentNexusSanity(null);
      setCurrentNexusMv(null);
      setCurrentNexusDef(null);
    }
  }, [selectedNexusCharacter, effectiveNexusCharacterStats, currentNexusArsenal]);

  const handleSelectCharacterForNexus = (character: Character) => {
    setSelectedNexusCharacter(character);
    setPartyMembers([character]);
    setSelectedCharacterArsenalId(null); 
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
    const summary = `Sword & Shield: ${faceCounts.swordandshield}, Double Sword: ${faceCounts['double-sword']}, Blank: ${faceCounts.blank}`;
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
    
    const newHistory = [drawnCard, ...nexusDrawnCardsHistory].slice(0, 5);
    setNexusDrawnCardsHistory(newHistory);
    setNexusCardKey(prev => prev + 1);
    toast({ title: "Card Drawn!", description: `Drew ${drawnCard.name} from ${deck.name}.` });
  };

  const handleNexusStatChange = (stat: 'hp' | 'sanity' | 'mv' | 'def', operation: 'increment' | 'decrement') => {
    if (!effectiveNexusCharacterStats) return;
    const delta = operation === 'increment' ? 1 : -1;
    
    let setter: React.Dispatch<React.SetStateAction<number | null>> | null = null;
    let currentValue: number | null = null;
    let maxValueForStat: number | undefined = undefined;

    switch (stat) {
        case 'hp':
            setter = setCurrentNexusHp; currentValue = currentNexusHp; maxValueForStat = effectiveNexusCharacterStats.maxHp;
            break;
        case 'sanity':
            setter = setCurrentNexusSanity; currentValue = currentNexusSanity; maxValueForStat = effectiveNexusCharacterStats.maxSanity;
            break;
        case 'mv':
            setter = setCurrentNexusMv; currentValue = currentNexusMv; maxValueForStat = effectiveNexusCharacterStats.mv;
            break;
        case 'def':
            setter = setCurrentNexusDef; currentValue = currentNexusDef; maxValueForStat = effectiveNexusCharacterStats.def;
            break;
        default: return;
    }

    if (setter && currentValue !== null) {
        let newValue = currentValue + delta;
        newValue = Math.max(0, newValue); 
        if (maxValueForStat !== undefined) { 
          newValue = Math.min(newValue, maxValueForStat);
        }
        setter(newValue);
    }
  };

  const getStatProgressColorClass = (current: number | null, max: number | undefined, statType?: 'hp' | 'sanity' | 'mv' | 'def'): string => {
    if (current === null || max === undefined || max === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (current / max) * 100;
    if (statType === 'sanity') {
      if (percentage > 66) return "[&>div]:bg-blue-500";
      if (percentage > 33) return "[&>div]:bg-blue-400";
      return "[&>div]:bg-red-500";
    }
    if (statType === 'def' || statType === 'mv') {
      if (percentage >= 75) return "[&>div]:bg-green-500"; 
      if (percentage >= 40) return "[&>div]:bg-yellow-500";
      return "[&>div]:bg-red-500";
    }
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  const openImageModal = (imageUrl: string) => {
    setEnlargedImageUrl(imageUrl);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); 
    setTouchEndY(null); 
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) {
        setTouchStartX(null); setTouchEndX(null); setTouchStartY(null); setTouchEndY(null);
        return;
    }

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE * 0.8 && currentNexusArsenal) { 
        if (enlargedImageUrl === currentNexusArsenal.imageUrlFront && currentNexusArsenal.imageUrlBack) {
            setEnlargedImageUrl(currentNexusArsenal.imageUrlBack);
        } else if (enlargedImageUrl === currentNexusArsenal.imageUrlBack && currentNexusArsenal.imageUrlFront) {
            setEnlargedImageUrl(currentNexusArsenal.imageUrlFront);
        }
    } 
    else if (Math.abs(deltaX) < MAX_TAP_MOVEMENT && Math.abs(deltaY) < MAX_TAP_MOVEMENT) {
        setEnlargedImageUrl(null); 
    }

    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
    setTouchEndY(null);
  };

  return (
    <Dialog open={isCharacterSelectionDialogOpen} onOpenChange={setIsCharacterSelectionDialogOpen}>
      <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border">
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col space-y-6">
           <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                <Dices className="mr-2 h-5 w-5 text-primary" />
                Dice Roller
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                        <ChevronsRight className="h-4 w-4" /> Roll
                        </Button>
                    </div>
                </div>
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
                        <ChevronsRight className="h-4 w-4" /> Roll
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
                            <CombatDieFaceImage key={idx} face={roll} size={48} />
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
          
            <div className={cn(
                "flex-shrink-0 flex bg-card rounded-lg p-4 shadow-md w-full",
                selectedNexusCharacter ? "flex-col items-start justify-start" : "flex-col items-center justify-center min-h-[200px]"
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
                            <Progress value={(currentNexusHp / (effectiveNexusCharacterStats.maxHp || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusHp, effectiveNexusCharacterStats.maxHp, 'hp'))} />
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
                            <Progress value={(currentNexusSanity / (effectiveNexusCharacterStats.maxSanity || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusSanity, effectiveNexusCharacterStats.maxSanity, 'sanity'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusSanity} / {effectiveNexusCharacterStats.maxSanity}</p>
                        </div>
                        )}
                        {currentNexusMv !== null && (
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Footprints className="mr-1.5 h-3 w-3 text-green-500" />MV</Label>
                                <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'decrement')} disabled={currentNexusMv === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={currentNexusMv} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'increment')} disabled={currentNexusMv === effectiveNexusCharacterStats.mv}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                             <Progress value={(currentNexusMv / (effectiveNexusCharacterStats.mv || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusMv, effectiveNexusCharacterStats.mv, 'mv'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusMv} / {effectiveNexusCharacterStats.mv}</p>
                        </div>
                        )}
                        {currentNexusDef !== null && (
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Shield className="mr-1.5 h-3 w-3 text-gray-400" />DEF</Label>
                                <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'decrement')} disabled={currentNexusDef === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={currentNexusDef} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'increment')} disabled={currentNexusDef === effectiveNexusCharacterStats.def}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(currentNexusDef / (effectiveNexusCharacterStats.def || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusDef, effectiveNexusCharacterStats.def, 'def'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusDef} / {effectiveNexusCharacterStats.def}</p>
                        </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-muted-foreground/20">
                        <Label htmlFor="nexusArsenalSelect" className="text-md font-medium text-accent flex items-center mb-1">
                        <Package className="mr-2 h-5 w-5" /> Selected Arsenal
                        </Label>
                        {criticalArsenalError ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{criticalArsenalError.name}</AlertTitle>
                            <AlertDescription>{criticalArsenalError.description} {criticalArsenalError.items?.[0]?.abilityName}</AlertDescription>
                        </Alert>
                        ) : (
                        <Select
                            value={selectedCharacterArsenalId || "none"}
                            onValueChange={(value) => setSelectedCharacterArsenalId(value === "none" ? null : value)}
                            disabled={!arsenalCards || arsenalCards.length === 0 || (arsenalCards.length === 1 && arsenalCards[0].id.startsWith('error-'))}
                        >
                            <SelectTrigger id="nexusArsenalSelect">
                            <SelectValue placeholder="No Arsenal Equipped..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {arsenalCards.filter(card => !card.id.startsWith('error-')).map(card => (
                                <SelectItem key={card.id} value={card.id}>
                                {card.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                        {currentNexusArsenal && (
                            <div className="mt-3 p-3 rounded-md border border-accent/50 bg-card/50">
                                 <h4 className="text-sm font-semibold text-accent">{currentNexusArsenal.name}</h4>
                                {currentNexusArsenal.description && <p className="text-xs text-muted-foreground mb-2">{currentNexusArsenal.description}</p>}
                                {(currentNexusArsenal.imageUrlFront || currentNexusArsenal.imageUrlBack) && (
                                    <div className="mt-2 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-2">
                                        {currentNexusArsenal.imageUrlFront && (
                                        <button
                                            type="button"
                                            onClick={() => openImageModal(currentNexusArsenal.imageUrlFront!)}
                                            className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            aria-label={`View front of ${currentNexusArsenal.name} card`}
                                        >
                                            <Image src={currentNexusArsenal.imageUrlFront} alt={`${currentNexusArsenal.name} - Front`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card front" />
                                        </button>
                                        )}
                                        {currentNexusArsenal.imageUrlBack && (
                                        <button
                                            type="button"
                                            onClick={() => openImageModal(currentNexusArsenal.imageUrlBack!)}
                                            className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            aria-label={`View back of ${currentNexusArsenal.name} card`}
                                        >
                                            <Image src={currentNexusArsenal.imageUrlBack} alt={`${currentNexusArsenal.name} - Back`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card back" />
                                        </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                {nexusDrawnCardsHistory.length > 0 ? (
                    <Card key={`${nexusDrawnCardsHistory[0].id}-${nexusCardKey}`} className="mt-2 bg-muted/30 border-primary/50 shadow-sm animate-in fade-in duration-300">
                        <CardHeader className="p-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span>Latest Card Drawn:</span>
                                <Badge variant="secondary" className="text-xs">{nexusDrawnCardsHistory[0].deck}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 text-left space-y-2">
                            <GameCardDisplay
                                card={nexusDrawnCardsHistory[0]}
                                size="medium" 
                                onClick={() => nexusDrawnCardsHistory[0].imageUrl && openImageModal(nexusDrawnCardsHistory[0].imageUrl)}
                                isButton={!!nexusDrawnCardsHistory[0].imageUrl}
                                className="mx-auto"
                             />
                        </CardContent>
                    </Card>
                ) : (
                     <p className="text-xs text-muted-foreground text-center pt-2">No card drawn yet.</p>
                )}

                {nexusDrawnCardsHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Previously Drawn</h4>
                    {nexusDrawnCardsHistory.slice(1).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {nexusDrawnCardsHistory.slice(1, 5).map((card, idx) => (
                          <GameCardDisplay
                            key={`${card.id}-hist-${idx}`}
                            card={card}
                            size="small"
                            onClick={() => card.imageUrl && openImageModal(card.imageUrl)}
                            isButton={!!card.imageUrl}
                            className="w-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">Draw more cards to see history.</p>
                    )}
                  </div>
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
        </main>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
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
                      <AvatarImage src={char.imageUrl || `https://placehold.co/40x40.png?text=${char.name.substring(0, 1)}`} alt={char.name} data-ai-hint="character avatar" />
                      <AvatarFallback>{char.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {char.name}
                  </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </div>

      <Dialog open={!!enlargedImageUrl} onOpenChange={(isOpen) => { if (!isOpen) setEnlargedImageUrl(null); }}>
        <DialogContent 
            className="max-w-5xl w-[95vw] h-[95vh] p-2 bg-background border-border shadow-xl flex flex-col"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Enlarged Card Image</DialogTitle>
            <DialogDescription>Full view of the selected card image.</DialogDescription>
          </DialogHeader>
          {enlargedImageUrl && (
            <div 
              className="relative flex-1 w-full h-full overflow-hidden rounded-md cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => !touchEndX && !touchEndY && setEnlargedImageUrl(null)} 
            >
              <Image
                src={enlargedImageUrl}
                alt="Enlarged card"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

