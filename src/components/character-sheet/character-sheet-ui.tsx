"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Heart, Footprints, Shield, Brain, Swords, LocateFixed, UserCircle, Minus, Plus, Save, RotateCcw } from "lucide-react";
import type { CharacterStats, CharacterStatDefinition, StatName } from "@/types/character";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const initialStats: CharacterStats = {
  hp: 10, maxHp: 10,
  mv: 3,
  def: 2,
  sanity: 8, maxSanity: 8,
  atk: 1,
  rng: 1,
};

const statDefinitions: CharacterStatDefinition[] = [
  { id: 'hp', label: "Health Points (HP)", icon: Heart, description: "Your character's vitality. Reaching 0 HP usually means defeat." },
  { id: 'sanity', label: "Sanity", icon: Brain, description: "Your character's mental stability. Low sanity can have dire consequences." },
  { id: 'mv', label: "Movement (MV)", icon: Footprints, description: "How many spaces your character can move." },
  { id: 'def', label: "Defense (DEF)", icon: Shield, description: "Reduces incoming damage." },
  { id: 'atk', label: "Attack (ATK)", icon: Swords, description: "Bonus to your attack rolls." },
  { id: 'rng', label: "Range (RNG)", icon: LocateFixed, description: "How far your character can attack." },
];


export function CharacterSheetUI() {
  const [stats, setStats] = useState<CharacterStats>(initialStats);
  const [characterName, setCharacterName] = useState("My Beast Hunter");
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);

  const handleStatChange = (statName: StatName, value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setStats(prevStats => {
      const newStats = { ...prevStats, [statName]: numericValue };
      // Clamp HP and Sanity between 0 and max
      if (statName === 'hp') newStats.hp = Math.max(0, Math.min(numericValue, newStats.maxHp));
      if (statName === 'maxHp') newStats.maxHp = Math.max(0, numericValue);
      if (statName === 'sanity') newStats.sanity = Math.max(0, Math.min(numericValue, newStats.maxSanity));
      if (statName === 'maxSanity') newStats.maxSanity = Math.max(0, numericValue);
      return newStats;
    });

    setHighlightedStat(statName);
    setTimeout(() => setHighlightedStat(null), 300);
  };
  
  const incrementStat = (statName: StatName) => {
    handleStatChange(statName, stats[statName] + 1);
  };

  const decrementStat = (statName: StatName) => {
    handleStatChange(statName, stats[statName] - 1);
  };

  const resetStats = () => {
    setStats(initialStats);
    setCharacterName("My Beast Hunter");
  };

  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = stats[def.id];
    const maxValue = def.id === 'hp' ? stats.maxHp : (def.id === 'sanity' ? stats.maxSanity : undefined);

    return (
      <div className={cn("p-4 rounded-lg border border-border bg-card/50 transition-all duration-300", highlightedStat === def.id ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor={def.id} className="flex items-center text-lg font-medium">
            <def.icon className="mr-2 h-6 w-6 text-primary" />
            {def.label}
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => decrementStat(def.id)} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={def.id}
              type="number"
              value={stats[def.id]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.id, e.target.value)}
              className="w-20 h-8 text-center text-lg font-bold"
            />
            <Button variant="outline" size="icon" onClick={() => incrementStat(def.id)} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isProgressStat && maxValue !== undefined && (
          <div className="mt-2">
            <Progress value={(currentValue / maxValue) * 100} className="h-3 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground text-right mt-1">{currentValue} / {maxValue}</p>
            { (def.id === 'hp' || def.id === 'sanity') &&
                <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor={`max${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`} className="text-sm text-muted-foreground whitespace-nowrap">Max {def.label.split(" ")[0]}:</Label>
                    <Input
                        id={`max${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`}
                        type="number"
                        value={maxValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.id === 'hp' ? 'maxHp' : 'maxSanity', e.target.value)}
                        className="w-20 h-8 text-center"
                    />
                </div>
            }
          </div>
        )}
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <UserCircle className="mr-3 h-10 w-10 text-primary" />
                <CardTitle className="text-3xl">Character Sheet</CardTitle>
            </div>
            <Button variant="ghost" onClick={resetStats} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset All
            </Button>
        </div>
        <CardDescription>Manage your character's attributes and status for Beast.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="characterName" className="text-lg font-medium">Character Name</Label>
          <Input
            id="characterName"
            value={characterName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCharacterName(e.target.value)}
            className="mt-1 text-xl p-2"
            placeholder="Enter character name"
          />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statDefinitions.map(def => <StatInputComponent key={def.id} def={def} />)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-6">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-5 w-5" /> Save Character (Demo)
        </Button>
      </CardFooter>
    </Card>
  );
}
