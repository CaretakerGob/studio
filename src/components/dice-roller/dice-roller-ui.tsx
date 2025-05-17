
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, ChevronsRight, RotateCcw, ShieldIcon, SwordsIcon, MinusSquareIcon } from 'lucide-react';
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

const combatDiceType = { value: 'combat', label: 'Combat Dice (Symbolic)' };

type CombatDieFace = 'shield' | 'double-sword' | 'blank';
const combatDieFaces: CombatDieFace[] = ['shield', 'shield', 'shield', 'double-sword', 'blank', 'blank'];

interface RollResult {
  rolls: (number | CombatDieFace)[];
  total: number | string; // Can be a sum or a summary string for combat dice
  diceNotation: string;
  timestamp: Date;
}

const CombatDieIcon: React.FC<{ face: CombatDieFace, className?: string }> = ({ face, className }) => {
  switch (face) {
    case 'shield':
      return <ShieldIcon className={cn("h-6 w-6 text-blue-500", className)} />;
    case 'double-sword':
      return <SwordsIcon className={cn("h-6 w-6 text-red-500", className)} />;
    case 'blank':
      return <MinusSquareIcon className={cn("h-6 w-6 text-gray-400", className)} />;
    default:
      return null;
  }
};

export function DiceRollerUI() {
  const [numDice, setNumDice] = useState(1);
  const [diceSides, setDiceSides] = useState('6'); // Default to d6
  const [customSides, setCustomSides] = useState('');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [latestRoll, setLatestRoll] = useState<RollResult | null>(null);

  const handleRoll = () => {
    let currentDiceNotation: string;
    const newRolls: (number | CombatDieFace)[] = [];
    let currentTotal: number | string = 0;

    if (diceSides === 'combat') {
      currentDiceNotation = `${numDice}x Combat Dice`;
      const faceCounts: Record<CombatDieFace, number> = { shield: 0, 'double-sword': 0, blank: 0 };
      for (let i = 0; i < numDice; i++) {
        const rollIndex = Math.floor(Math.random() * 6); // 0-5
        const face = combatDieFaces[rollIndex];
        newRolls.push(face);
        faceCounts[face]++;
      }
      currentTotal = `Shields: ${faceCounts.shield}, Swords: ${faceCounts['double-sword']}, Blanks: ${faceCounts.blank}`;
    } else if (diceSides === 'custom') {
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
      currentTotal = (newRolls as number[]).reduce((sum, roll) => sum + roll, 0);
    } else if (diceSides === '100') {
      currentDiceNotation = `${numDice}d%`;
      let grandTotal = 0;
      for (let k = 0; k < numDice; k++) {
        const d10Tens = Math.floor(Math.random() * 10) * 10;
        const d10Units = Math.floor(Math.random() * 10);
        const result = (d10Tens === 0 && d10Units === 0) ? 100 : d10Tens + d10Units;
        newRolls.push(result); // Store individual d100 results if numDice > 1
        grandTotal += result;
      }
       currentTotal = numDice > 1 ? grandTotal : newRolls[0]; // if multiple d100, sum them, else show single d100
       if (numDice === 1) {
         const d10Tens = Math.floor(newRolls[0] / 10) * 10;
         const d10Units = newRolls[0] % 10;
         const actualD10Tens = d10Tens === 100 ? 0 : d10Tens / 10; // e.g. for 100, tens die is '00'
         currentDiceNotation = `1d% (Rolled ${actualD10Tens === 0 ? '00': actualD10Tens*10} & ${d10Units === 0 && newRolls[0] === 100 ? 0 : newRolls[0] %10 })`;
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
      currentTotal = (newRolls as number[]).reduce((sum, roll) => sum + roll, 0);
    }
    
    const newRollResult: RollResult = {
      rolls: newRolls,
      total: currentTotal,
      diceNotation: currentDiceNotation,
      timestamp: new Date(),
    };

    setLatestRoll(newRollResult);
    setRollHistory(prev => [newRollResult, ...prev].slice(0, 20));
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLatestRoll(null);
  }

  const renderRolls = (rolls: (number | CombatDieFace)[]) => {
    return rolls.slice(0, 10).map((roll, index) => {
      if (typeof roll === 'string') {
        return <CombatDieIcon key={index} face={roll} className="mx-1" />;
      }
      return (
        <Badge key={index} variant="default" className="text-lg px-3 py-1 bg-primary/20 text-primary-foreground border border-primary">
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
                  <SelectGroup>
                    <SelectLabel>Combat Dice</SelectLabel>
                    <SelectItem value={combatDiceType.value}>{combatDiceType.label}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          {diceSides === 'custom' && (
            <div>
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
          <Button onClick={handleRoll} size="lg" className="w-full text-lg bg-primary hover:bg-primary/90">
            <ChevronsRight className="mr-2 h-6 w-6" /> Roll Dice
          </Button>
          
          {latestRoll && (
            <Card className="mt-6 bg-card/50 border-primary shadow-md transition-all animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  Latest Roll: <Badge variant="secondary" className="ml-2">{latestRoll.diceNotation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-2 mb-3 flex-wrap">
                  {renderRolls(latestRoll.rolls)}
                  {latestRoll.rolls.length > 10 && <Badge variant="outline" className="mt-2">...and {latestRoll.rolls.length - 10} more</Badge>}
                </div>
                 <p className="text-2xl font-bold text-center text-primary flex items-center justify-center">
                   {typeof latestRoll.total === 'string' ? latestRoll.total : `Total: ${latestRoll.total}`}
                </p>
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
                      {typeof r.total === 'string' ? r.total : `Rolls: ${r.rolls.join(', ')}`}
                    </div>
                    {typeof r.total !== 'string' && typeof r.rolls[0] !== 'string' && (
                       <div className="flex flex-wrap gap-1 mb-1">
                        {r.rolls.slice(0,5).map((rollVal, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{rollVal}</Badge>
                        ))}
                        {r.rolls.length > 5 && <Badge variant="outline" className="text-xs">...</Badge>}
                      </div>
                    )}
                     {typeof r.rolls[0] === 'string' && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {(r.rolls as CombatDieFace[]).slice(0,5).map((face, i) => (
                          <CombatDieIcon key={i} face={face} className="h-4 w-4"/>
                        ))}
                        {r.rolls.length > 5 && <span className="text-xs">...</span>}
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
