
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, ChevronsRight, RotateCcw, PlusCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

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
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fblank%20188x188%20sticker.png?alt=media&token=305ce3df-c485-43a8-8f1f-6591e104f249',
    dataAiHint: 'blank die',
    altText: 'Blank Die Face'
  },
};

const faceTypeLabels: Record<CombatDieFace, string> = {
  swordandshield: 'Sword & Shield',
  'double-sword': 'Double Sword',
  blank: 'Blank',
};

interface NumberedDiceConfig {
  id: string;
  numDice: number;
  diceSides: string;
  customSides: string;
}

interface NumberedDiceGroupResult {
  notation: string;
  rolls: number[];
  total: number;
}

interface CombatDiceResult {
  notation: string;
  rolls: CombatDieFace[];
  summary: string;
}

interface LatestRollData {
  type: 'numbered' | 'combat';
  groups: Array<NumberedDiceGroupResult | CombatDiceResult>; 
  overallTotal?: number; 
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
  const [numberedDiceConfigs, setNumberedDiceConfigs] = useState<NumberedDiceConfig[]>([]);
  const [numCombatDice, setNumCombatDice] = useState(1);
  const [rollHistory, setRollHistory] = useState<LatestRollData[]>([]);
  const [latestRoll, setLatestRoll] = useState<LatestRollData | null>(null);
  const [latestRollKey, setLatestRollKey] = useState(0);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    // Initialize default dice configuration on client mount to avoid hydration mismatch
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
          return; // Skip this group if numDice is invalid
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
  }

  const renderNumberedGroupRolls = (rolls: number[]) => {
     return rolls.map((roll, index) => (
      <Badge key={index} variant="default" className="text-lg px-3 py-1 bg-primary/20 text-primary-foreground border border-primary align-middle">
        {roll}
      </Badge>
    ));
  }

  const renderCombatRolls = (rolls: CombatDieFace[]) => {
    return rolls.map((roll, index) => (
      <div key={index} className="inline-block align-middle p-1">
        <CombatDieFaceImage face={roll} size={48} />
      </div>
    ));
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
                  <div className="sm:col-span-1"> {/* Ensure customSides input aligns correctly */}
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
                {/* Ensure consistent grid columns even when customSides is not shown */}
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
                  Latest Roll Results:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestRoll.type === 'numbered' && latestRoll.groups.map((group, index) => (
                  <div key={index} className="p-3 border border-muted-foreground/30 rounded-md bg-muted/20">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary" className="text-base">{ (group as NumberedDiceGroupResult).notation }</Badge>
                      <p className="text-xl font-bold text-primary">Total: { (group as NumberedDiceGroupResult).total }</p>
                    </div>
                    <div className="flex items-center justify-center space-x-2 mb-1 flex-wrap min-h-[30px]">
                      {renderNumberedGroupRolls((group as NumberedDiceGroupResult).rolls)}
                    </div>
                  </div>
                ))}
                {latestRoll.type === 'numbered' && latestRoll.overallTotal !== undefined && (
                   <p className="text-2xl font-bold text-center text-primary mt-3">
                     Overall Total: {latestRoll.overallTotal}
                   </p>
                )}

                {latestRoll.type === 'combat' && latestRoll.groups.map((group, index) => {
                  const combatGroup = group as CombatDiceResult;
                  return (
                    <div key={index} className="p-3 border border-muted-foreground/30 rounded-md bg-muted/20">
                       <div className="flex justify-between items-center mb-2">
                         <Badge variant="secondary" className="text-base">{combatGroup.notation}</Badge>
                       </div>
                      <div className="flex flex-wrap justify-center items-center gap-1 mb-3 min-h-[40px]">
                        {renderCombatRolls(combatGroup.rolls)}
                      </div>
                      <div className="flex justify-around items-start text-center mt-4 space-x-2">
                        {(['swordandshield', 'double-sword', 'blank'] as CombatDieFace[]).map(faceKey => {
                          const count = combatGroup.rolls.filter(r => r === faceKey).length;
                          const label = faceTypeLabels[faceKey];
                          return (
                            <div key={faceKey} className="flex flex-col items-center p-2 rounded-md bg-muted/30 flex-1 min-w-0">
                              {/* <CombatDieFaceImage face={faceKey} size={32} className="mb-1" /> */}
                              <p className="text-sm font-medium text-foreground">{label}</p>
                              <p className="text-lg font-bold text-primary">{count}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                    {r.type === 'numbered' ? (
                      <>
                        <div className="flex justify-between w-full items-center mb-1">
                          <span className="font-medium">
                            {r.groups.map(g => (g as NumberedDiceGroupResult).notation).join(' + ')}
                          </span>
                          <Badge variant={index === 0 ? "default" : "secondary"} className={cn("text-xs", index === 0 ? "bg-primary text-primary-foreground" : "")}>
                            Total: {r.overallTotal}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1 space-y-1">
                          {r.groups.map((g, gi) => {
                            const group = g as NumberedDiceGroupResult;
                            return (
                              <div key={gi}>
                                {group.notation}: [{group.rolls.join(', ')}] (Subtotal: {group.total})
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : ( 
                       <>
                        <div className="flex justify-between w-full items-center mb-1">
                           <span className="font-medium">{(r.groups[0] as CombatDiceResult).notation}</span>
                           <Badge variant={index === 0 ? "default" : "secondary"} className={cn("text-xs", index === 0 ? "bg-primary text-primary-foreground" : "")}>
                             Summary
                           </Badge>
                         </div>
                        <div className="text-xs text-muted-foreground mb-1">
                           {(r.groups[0] as CombatDiceResult).summary}
                         </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                           {(r.groups[0] as CombatDiceResult).rolls.map((face, i) => (
                             <CombatDieFaceImage key={i} face={face} size={16} className="mx-0.5"/>
                           ))}
                         </div>
                       </>
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

