
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, ChevronsRight, RotateCcw, PlusCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { CombatDieFaceImage, type CombatDieFace } from './combat-die-face-image'; // Moved
import { LatestRollCard } from './latest-roll-card';
import { RollHistoryCard } from './roll-history-card';

const numberedDiceSideOptions = [
  { value: '4', label: 'd4' },
  { value: '6', label: 'd6' },
  { value: '8', label: 'd8' },
  { value: '10', label: 'd10 (0-9)' },
  { value: '100', label: 'd100 (Percentile)' },
  { value: '12', label: 'd12' },
  { value: '20', label: 'd20' },
  { value: 'custom', label: 'Custom Sides' },
];

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

export interface NumberedDiceConfig {
  id: string;
  numDice: number;
  diceSides: string;
  customSides: string;
}

export interface NumberedDiceGroupResult {
  notation: string;
  rolls: number[];
  total: number;
}

export interface CombatDiceResult {
  notation: string;
  rolls: CombatDieFace[];
  summary: string;
}

export interface LatestRollData {
  type: 'numbered' | 'combat';
  groups: Array<NumberedDiceGroupResult | CombatDiceResult>;
  overallTotal?: number;
  timestamp: Date;
}

export function DiceRollerUI() {
  const [numberedDiceConfigs, setNumberedDiceConfigs] = useState<NumberedDiceConfig[]>([]);
  const [numCombatDice, setNumCombatDice] = useState(1);
  const [rollHistory, setRollHistory] = useState<LatestRollData[]>([]);
  const [latestRoll, setLatestRoll] = useState<LatestRollData | null>(null);
  const [latestRollKey, setLatestRollKey] = useState(0);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (numberedDiceConfigs.length === 0) {
      setNumberedDiceConfigs([
        { id: generateId(), numDice: 1, diceSides: '6', customSides: '' }
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNumberedDiceConfig = () => {
    setNumberedDiceConfigs(prev => [
      ...prev,
      { id: generateId(), numDice: 1, diceSides: '6', customSides: '' }
    ]);
  };

  const updateNumberedDiceConfig = (id: string, field: keyof Omit<NumberedDiceConfig, 'id'>, value: string | number) => {
    setNumberedDiceConfigs(prev => prev.map(config =>
      config.id === id ? { ...config, [field]: typeof value === 'number' ? Math.max(1, value) : value } : config
    ));
  };

  const removeNumberedDiceConfig = (id: string) => {
    if (numberedDiceConfigs.length > 1) {
      setNumberedDiceConfigs(prev => prev.filter(config => config.id !== id));
    }
  };

  const recordRoll = (rollData: LatestRollData) => {
    setLatestRoll(rollData);
    setLatestRollKey(prevKey => prevKey + 1);
    setRollHistory(prev => [rollData, ...prev].slice(0, 20));
  };

  const handleNumberedRoll = () => {
    if (numberedDiceConfigs.length === 0) {
        alert("Please add at least one dice type to roll.");
        return;
    }
    const groupResults: NumberedDiceGroupResult[] = [];
    let overallTotal = 0;

    numberedDiceConfigs.forEach(config => {
      const currentRolls: number[] = [];
      let currentGroupTotal = 0;
      let currentDiceNotation: string;
      const numDice = config.numDice;

      if (numDice < 1) {
          alert(`Number of dice must be at least 1 for configuration: ${config.id}.`);
          return;
      }

      if (config.diceSides === 'custom') {
        const sides = parseInt(config.customSides);
        if (isNaN(sides) || sides < 2) {
          alert(`Invalid custom sides for dice group: ${config.customSides}. Must be a number greater than 1.`);
          return;
        }
        currentDiceNotation = `${numDice}d${sides}`;
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * sides) + 1;
          currentRolls.push(roll);
        }
      } else if (config.diceSides === '100') {
        currentDiceNotation = `${numDice}d%`;
        for (let k = 0; k < numDice; k++) {
          const d10Tens = Math.floor(Math.random() * 10) * 10;
          const d10Units = Math.floor(Math.random() * 10);
          const result = (d10Tens === 0 && d10Units === 0) ? 100 : d10Tens + d10Units;
          currentRolls.push(result);
        }
      } else {
        const sides = parseInt(config.diceSides);
        if (isNaN(sides) || sides < 2) {
          alert(`Invalid dice type selected for one of the groups.`);
          return;
        }
        currentDiceNotation = `${numDice}d${sides}`;
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * sides) + (config.diceSides === '10' ? 0 : 1);
          currentRolls.push(roll);
        }
      }
      currentGroupTotal = currentRolls.reduce((sum, roll) => sum + roll, 0);
      groupResults.push({ notation: currentDiceNotation, rolls: currentRolls, total: currentGroupTotal });
      overallTotal += currentGroupTotal;
    });

    if (groupResults.length > 0) {
      recordRoll({
        type: 'numbered',
        groups: groupResults,
        overallTotal,
        timestamp: new Date(),
      });
    }
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
      const rollIndex = Math.floor(Math.random() * 6);
      const face = combatDieFaces[rollIndex];
      newRolls.push(face);
      faceCounts[face]++;
    }
    const summary = `sword&shield: ${faceCounts.swordandshield}, double sword: ${faceCounts['double-sword']}, blank: ${faceCounts.blank}`;

    recordRoll({
      type: 'combat',
      groups: [{ notation: currentDiceNotation, rolls: newRolls, summary: summary }],
      timestamp: new Date(),
    });
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLatestRoll(null);
  };

  const resetCombatDice = () => {
    setNumCombatDice(1);
    if (latestRoll?.type === 'combat') {
      setLatestRoll(null);
    }
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
            {numberedDiceConfigs.map((config) => (
              <div key={config.id} className="grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-end mb-2 p-2 border border-muted-foreground/20 rounded-md">
                <div>
                  <Label htmlFor={`numDice-${config.id}`}># Dice</Label>
                  <Input
                    id={`numDice-${config.id}`}
                    type="number"
                    value={config.numDice}
                    onChange={(e) => updateNumberedDiceConfig(config.id, 'numDice', parseInt(e.target.value))}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`diceType-${config.id}`}>Type</Label>
                  <Select value={config.diceSides} onValueChange={(value) => updateNumberedDiceConfig(config.id, 'diceSides', value)}>
                    <SelectTrigger id={`diceType-${config.id}`} className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {numberedDiceSideOptions.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {config.diceSides === 'custom' && (
                  <div className="sm:col-span-1">
                    <Label htmlFor={`customSides-${config.id}`}>Sides</Label>
                    <Input
                      id={`customSides-${config.id}`}
                      type="number"
                      value={config.customSides}
                      onChange={(e) => updateNumberedDiceConfig(config.id, 'customSides', e.target.value)}
                      placeholder="e.g., 3"
                      min="2"
                      className="mt-1"
                    />
                  </div>
                )}
                {config.diceSides !== 'custom' && <div className="hidden sm:block"></div>}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNumberedDiceConfig(config.id)}
                  disabled={numberedDiceConfigs.length <= 1}
                  className="text-destructive hover:text-destructive/80 self-end h-10 w-10"
                  aria-label="Remove dice configuration"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button onClick={addNumberedDiceConfig} variant="outline" size="sm" className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Dice Type
            </Button>
            <Button onClick={handleNumberedRoll} size="lg" className="w-full text-lg bg-primary hover:bg-primary/90 mt-4" disabled={numberedDiceConfigs.length === 0}>
              <ChevronsRight className="mr-2 h-6 w-6" /> Roll All Numbered Dice
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
            <div className="flex space-x-2 mt-4">
                <Button onClick={handleCombatRoll} size="lg" className="flex-grow text-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                <Dices className="mr-2 h-6 w-6" /> Roll {numCombatDice} Combat Dice
                </Button>
                <Button onClick={resetCombatDice} variant="outline" size="lg" className="text-lg">
                <RotateCcw className="mr-2 h-5 w-5" /> Reset
                </Button>
            </div>
          </div>
          <LatestRollCard latestRoll={latestRoll} latestRollKey={latestRollKey} />
        </CardContent>
      </Card>

      <RollHistoryCard rollHistory={rollHistory} onClearHistory={clearHistory} />
    </div>
  );
}
