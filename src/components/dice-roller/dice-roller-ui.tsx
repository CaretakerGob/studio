"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, ChevronsRight, RotateCcw, Sigma } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const diceTypes = [
  { value: '4', label: 'd4' },
  { value: '6', label: 'd6' },
  { value: '8', label: 'd8' },
  { value: '10', label: 'd10 (0-9)' },
  { value: '100', label: 'd100 (Percentile)' }, // Actually 00-90 for d10 based percentile
  { value: '12', label: 'd12' },
  { value: '20', label: 'd20' },
  { value: 'custom', label: 'Custom' },
];

interface RollResult {
  rolls: number[];
  total: number;
  diceNotation: string;
  timestamp: Date;
}

export function DiceRollerUI() {
  const [numDice, setNumDice] = useState(1);
  const [diceSides, setDiceSides] = useState('6');
  const [customSides, setCustomSides] = useState('');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [latestRoll, setLatestRoll] = useState<RollResult | null>(null);

  const handleRoll = () => {
    let sides: number;
    let currentDiceNotation: string;

    if (diceSides === 'custom') {
      sides = parseInt(customSides);
      if (isNaN(sides) || sides < 2) {
        alert("Invalid custom sides. Must be a number greater than 1.");
        return;
      }
      currentDiceNotation = `${numDice}d${sides}`;
    } else if (diceSides === '100') { // Percentile dice (2d10, one for tens, one for units)
      const d10Tens = Math.floor(Math.random() * 10) * 10; // 00, 10, ..., 90
      const d10Units = Math.floor(Math.random() * 10);    // 0, 1, ..., 9
      const result = (d10Tens === 0 && d10Units === 0) ? 100 : d10Tens + d10Units; // 00 and 0 is 100
      
      const newRoll: RollResult = {
        rolls: [d10Tens / 10, d10Units], // Store underlying d10s for clarity if needed
        total: result,
        diceNotation: `${numDice}d% (Rolled ${d10Tens/10 === 0 ? '00': d10Tens} & ${d10Units})`,
        timestamp: new Date(),
      };
      setLatestRoll(newRoll);
      setRollHistory(prev => [newRoll, ...prev].slice(0, 20)); // Keep last 20 rolls
      return;
    } else {
      sides = parseInt(diceSides);
      currentDiceNotation = `${numDice}d${sides}`;
    }
    
    if (isNaN(sides) || sides < 2 || numDice < 1) {
      alert("Invalid input for dice or sides.");
      return;
    }

    const newRolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * sides) + (diceSides === '10' ? 0 : 1) ); // d10 is 0-9
    const total = newRolls.reduce((sum, roll) => sum + roll, 0);
    
    const newRollResult: RollResult = {
      rolls: newRolls,
      total,
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
                    <SelectLabel>Standard Dice</SelectLabel>
                    {diceTypes.filter(d => d.value !== 'custom').map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Sides</SelectItem>
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
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {latestRoll.rolls.slice(0,10).map((roll, index) => ( // Show up to 10 dice for brevity
                    <Badge key={index} variant="default" className="text-lg px-3 py-1 bg-primary/20 text-primary-foreground border border-primary">
                      {roll}
                    </Badge>
                  ))}
                  {latestRoll.rolls.length > 10 && <Badge variant="outline">...and {latestRoll.rolls.length - 10} more</Badge>}
                </div>
                 <p className="text-3xl font-bold text-center text-primary flex items-center justify-center">
                  <Sigma className="h-8 w-8 mr-2"/> Total: {latestRoll.total}
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
          <ScrollArea className="h-[300px] pr-3"> {/* Adjusted height */}
            {rollHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No rolls yet. Make your first roll!</p>
            ) : (
              <ul className="space-y-3">
                {rollHistory.map((r, index) => (
                  <li key={index} className={cn(
                    "p-3 rounded-md border bg-card/80 flex justify-between items-center text-sm transition-all",
                    index === 0 ? "border-primary shadow-sm" : "border-border"
                  )}>
                    <div>
                      <span className="font-medium">{r.diceNotation}: </span>
                      <span className="text-primary font-bold">{r.total}</span>
                      <p className="text-xs text-muted-foreground">
                        Rolls: {r.rolls.join(', ')} ({r.timestamp.toLocaleTimeString()})
                      </p>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "bg-primary text-primary-foreground" : ""}>
                      {r.total}
                    </Badge>
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
