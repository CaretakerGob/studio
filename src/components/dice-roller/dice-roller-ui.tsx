
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, ChevronsRight, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const numberedDiceTypes = [
  { value: '4', label: 'd4' },
  { value: '6', label: 'd6' },
  { value: '8', label: 'd8' },
  { value: '10', label: 'd10 (0-9)' },
  { value: '100', label: 'd100 (Percentile)' },
  { value: '12', label: 'd12' },
  { value: '20', label: 'd20' },
  { value: 'custom', label: 'Custom Sides' },
];

type CombatDieFace = 'swordandshield' | 'double-sword' | 'blank';
const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

interface CombatDieFaceDetails {
  imageUrl: string;
  dataAiHint: string;
  altText: string;
}

const combatDieFaceImages: Record<CombatDieFace, CombatDieFaceDetails> = {
  swordandshield: {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fshields%20and%20sword%20188x188%20sticker.jpg?alt=media&token=7b8120cd-3495-4592-828d-9310534784f8',
    dataAiHint: 'shield sword',
    altText: 'Sword and Shield Face'
  },
  'double-sword': {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fcrossed%20swords%20188x188.jpg?alt=media&token=6e1e277e-462d-4777-af3b-e7a6e7b89789',
    dataAiHint: 'crossed swords',
    altText: 'Double Sword Face'
  },
  blank: {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fblank%20188x188%20sticker.png?alt=media&token=08ff6336-a822-4615-8873-0291733210bc',
    dataAiHint: 'blank die',
    altText: 'Blank Die Face'
  },
};

const faceTypeLabels: Record<CombatDieFace, string> = {
  swordandshield: 'Sword & Shield',
  'double-sword': 'Double Sword',
  blank: 'Blank',
};

interface RollResult {
  rolls: (number | CombatDieFace)[];
  total: number | string; // Can be a sum or a summary string for combat dice
  diceNotation: string;
  timestamp: Date;
}

const CombatDieFaceImage: React.FC<{ face: CombatDieFace, className?: string, size?: number }> = ({ face, className, size = 24 }) => {
  const faceDetails = combatDieFaceImages[face];
  if (!faceDetails) return null;

  return (
    <Image
      src={faceDetails.imageUrl}
      alt={faceDetails.altText}
      width={size}
      height={size}
      data-ai-hint={faceDetails.dataAiHint}
      className={cn("inline-block", className)}
    />
  );
};

export function DiceRollerUI() {
  const [numDice, setNumDice] = useState(1);
  const [diceSides, setDiceSides] = useState('6');
  const [customSides, setCustomSides] = useState('');
  const [numCombatDice, setNumCombatDice] = useState(1);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [latestRoll, setLatestRoll] = useState<RollResult | null>(null);
  const [latestRollKey, setLatestRollKey] = useState(0); // Key for re-triggering animation

  const recordRoll = (rolls: (number | CombatDieFace)[], total: number | string, diceNotation: string) => {
    const newRollResult: RollResult = {
      rolls,
      total,
      diceNotation,
      timestamp: new Date(),
    };
    setLatestRoll(newRollResult);
    setLatestRollKey(prevKey => prevKey + 1); // Increment key to re-trigger animation
    setRollHistory(prev => [newRollResult, ...prev].slice(0, 20));
  };

  const handleNumberedRoll = () => {
    let currentDiceNotation: string;
    const newRolls: number[] = [];
    let currentTotal: number = 0;

    if (diceSides === 'custom') {
      const sides = parseInt(customSides);
      if (isNaN(sides) || sides < 2) {
        alert("Invalid custom sides. Must be a number greater than 1.");
        return;
      }
      currentDiceNotation = `${numDice}d${sides}`;
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        newRolls.push(roll);
      }
      currentTotal = newRolls.reduce((sum, roll) => sum + roll, 0);
    } else if (diceSides === '100') {
      currentDiceNotation = `${numDice}d%`;
      let grandTotal = 0;
      for (let k = 0; k < numDice; k++) {
        const d10Tens = Math.floor(Math.random() * 10) * 10;
        const d10Units = Math.floor(Math.random() * 10);
        const result = (d10Tens === 0 && d10Units === 0) ? 100 : d10Tens + d10Units;
        newRolls.push(result);
        grandTotal += result;
      }
       currentTotal = numDice > 1 ? grandTotal : newRolls[0];
       if (numDice === 1 && newRolls.length > 0 && typeof newRolls[0] === 'number') {
         const rollValue = newRolls[0];
         const d10TensValue = Math.floor(rollValue / 10) * 10;
         const d10UnitsValue = rollValue % 10;
         const actualD10TensDisplay = d10TensValue === 100 ? '00' : (d10TensValue === 0 ? '00' : d10TensValue.toString().padStart(2, '0'));
         const actualD10UnitsDisplay = rollValue === 100 ? '0' : d10UnitsValue;

         currentDiceNotation = `1d% (Rolled ${actualD10TensDisplay} & ${actualD10UnitsDisplay})`;
       }
    } else {
      const sides = parseInt(diceSides);
      if (isNaN(sides) || sides < 2 || numDice < 1) {
        alert("Invalid input for dice or sides.");
        return;
      }
      currentDiceNotation = `${numDice}d${sides}`;
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * sides) + (diceSides === '10' ? 0 : 1); // d10 is 0-9
        newRolls.push(roll);
      }
      currentTotal = newRolls.reduce((sum, roll) => sum + roll, 0);
    }

    recordRoll(newRolls, currentTotal, currentDiceNotation);
  };

  const handleCombatRoll = () => {
    if (numCombatDice < 1 || numCombatDice > 12) {
      alert("Number of combat dice must be between 1 and 12.");
      return;
    }
    const currentDiceNotation = `${numCombatDice}x Combat Dice`;
    const newRolls: CombatDieFace[] = [];
    const faceCounts: Record<CombatDieFace, number> = { swordandshield: 0, 'double-sword': 0, blank: 0 };
    for (let i = 0; i < numCombatDice; i++) {
      const rollIndex = Math.floor(Math.random() * 6); // 0-5
      const face = combatDieFaces[rollIndex];
      newRolls.push(face);
      faceCounts[face]++;
    }
    const currentTotal = `sword&shield: ${faceCounts.swordandshield}, double sword: ${faceCounts['double-sword']}, blank: ${faceCounts.blank}`;

    recordRoll(newRolls, currentTotal, currentDiceNotation);
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLatestRoll(null);
  }

  const renderRolls = (rolls: (number | CombatDieFace)[]) => {
    return rolls.slice(0, 10).map((roll, index) => {
      if (typeof roll === 'string') { // CombatDieFace
        return (
          <div key={index} className="inline-block mx-1 align-middle">
            <CombatDieFaceImage face={roll} size={32} />
          </div>
        );
      }
      return ( // Numbered die
        <Badge key={index} variant="default" className="text-lg px-3 py-1 bg-primary/20 text-primary-foreground border border-primary align-middle">
          {roll}
        </Badge>
      );
    });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-2 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Dices className="mr-3 h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">Dice Roller</CardTitle>
          </div>
          <CardDescription>Configure and roll your dice. Results appear below and in history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-lg font-medium mb-2 text-primary">Numbered Dice</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="numDice">Number of Dice</Label>
                <Input
                  id="numDice"
                  type="number"
                  value={numDice}
                  onChange={(e) => setNumDice(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="diceType">Type of Dice</Label>
                <Select value={diceSides} onValueChange={setDiceSides}>
                  <SelectTrigger id="diceType" className="mt-1">
                    <SelectValue placeholder="Select dice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Numbered Dice</SelectLabel>
                      {numberedDiceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {diceSides === 'custom' && (
              <div className="mt-4">
                <Label htmlFor="customSides">Custom Sides (e.g., 3, 50)</Label>
                <Input
                  id="customSides"
                  type="number"
                  value={customSides}
                  onChange={(e) => setCustomSides(e.target.value)}
                  placeholder="Enter number of sides"
                  min="2"
                  className="mt-1"
                />
              </div>
            )}
            <Button onClick={handleNumberedRoll} size="lg" className="w-full text-lg bg-primary hover:bg-primary/90 mt-4">
              <ChevronsRight className="mr-2 h-6 w-6" /> Roll Numbered Dice
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="text-lg font-medium mb-2 text-primary">Combat Dice</h4>
            <div>
              <Label htmlFor="numCombatDice">Number of Combat Dice (1-12)</Label>
              <Input
                id="numCombatDice"
                type="number"
                value={numCombatDice}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val < 1) setNumCombatDice(1);
                  else if (val > 12) setNumCombatDice(12);
                  else setNumCombatDice(val);
                }}
                min="1"
                max="12"
                className="mt-1"
              />
            </div>
            <Button onClick={handleCombatRoll} size="lg" className="w-full text-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground mt-4">
              <Dices className="mr-2 h-6 w-6" /> Roll {numCombatDice} Combat Dice
            </Button>
          </div>

          {latestRoll && (
            <Card 
              key={latestRollKey}
              className="mt-6 bg-card/50 border-primary shadow-md transition-all animate-in fade-in duration-500"
            >
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  Latest Roll: <Badge variant="secondary" className="ml-2">{latestRoll.diceNotation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-2 mb-3 flex-wrap min-h-[40px]">
                  {renderRolls(latestRoll.rolls)}
                  {latestRoll.rolls.length > 10 && <Badge variant="outline" className="mt-2">...and {latestRoll.rolls.length - 10} more</Badge>}
                </div>
                 
                {typeof latestRoll.total === 'string' && Array.isArray(latestRoll.rolls) && latestRoll.rolls.every(r => typeof r === 'string') ? (
                  // Combat Roll Summary
                  <div className="flex justify-around items-start text-center mt-4 space-x-2">
                    {(['swordandshield', 'double-sword', 'blank'] as CombatDieFace[]).map(faceKey => {
                      const count = (latestRoll.rolls as CombatDieFace[]).filter(r => r === faceKey).length;
                      const label = faceTypeLabels[faceKey];
                      return (
                        <div key={faceKey} className="flex flex-col items-center p-2 rounded-md bg-muted/30 flex-1 min-w-0">
                          <CombatDieFaceImage face={faceKey} size={40} className="mb-1" />
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-lg font-bold text-primary">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Numbered Roll Total
                  <p className="text-2xl font-bold text-center text-primary">
                    Total: {latestRoll.total}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Roll History</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearHistory} disabled={rollHistory.length === 0}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
          <CardDescription>Last 20 rolls are stored here.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-3">
            {rollHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No rolls yet. Make your first roll!</p>
            ) : (
              <ul className="space-y-3">
                {rollHistory.map((r, index) => (
                  <li key={index} className={cn(
                    "p-3 rounded-md border bg-card/80 flex flex-col items-start text-sm transition-all",
                    index === 0 ? "border-primary shadow-sm" : "border-border"
                  )}>
                    <div className="flex justify-between w-full items-center mb-1">
                      <span className="font-medium">{r.diceNotation}</span>
                       <Badge variant={index === 0 ? "default" : "secondary"} className={cn("text-xs", index === 0 ? "bg-primary text-primary-foreground" : "")}>
                        {typeof r.total === 'string' ? 'Summary' : r.total}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {typeof r.total === 'string' ? r.total : `Rolls: ${r.rolls.map(roll => typeof roll === 'string' ? roll.charAt(0).toUpperCase() + roll.slice(1) : roll).join(', ')}`}
                    </div>
                    {typeof r.rolls[0] === 'string' && ( // Combat dice
                       <div className="flex flex-wrap gap-1 mb-1">
                        {(r.rolls as CombatDieFace[]).slice(0,5).map((face, i) => (
                          <CombatDieFaceImage key={i} face={face} size={16} className="mx-0.5"/>
                        ))}
                        {r.rolls.length > 5 && <span className="text-xs">...</span>}
                      </div>
                    )}
                    {typeof r.rolls[0] !== 'string' && ( // Numbered dice
                       <div className="flex flex-wrap gap-1 mb-1">
                        {r.rolls.slice(0,5).map((rollVal, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{rollVal}</Badge>
                        ))}
                        {r.rolls.length > 5 && <Badge variant="outline" className="text-xs">...</Badge>}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/70 self-end">{r.timestamp.toLocaleTimeString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

