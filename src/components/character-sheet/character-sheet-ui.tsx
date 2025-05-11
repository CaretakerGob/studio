
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Footprints, Shield, Brain, Swords, LocateFixed, UserCircle, Minus, Plus, Save, RotateCcw, BookOpen, Zap, ShieldAlert } from "lucide-react";
import type { CharacterStats, CharacterStatDefinition, StatName, Character, Ability } from "@/types/character";
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

const charactersData: Character[] = [
  {
    id: 'custom',
    name: 'Custom Character',
    baseStats: initialStats,
    abilities: [],
    avatarSeed: 'customcharacter'
  },
  {
    id: 'warden',
    name: 'Warden',
    baseStats: { hp: 12, maxHp: 12, mv: 2, def: 3, sanity: 7, maxSanity: 7, atk: 2, rng: 1 },
    avatarSeed: 'warden',
    abilities: [
      { id: 'vital_shot', name: 'Vital Shot', type: 'Action', description: 'Re-rolls 2 missed Attack Dice.', details: 'A4/R5 - PHYS', cooldown: '2 round CD' },
      { id: 'wounding_strike', name: 'Wounding Strike', type: 'Action', description: 'Bypasses Targets Armor Effect. Damaged targets are WOUNDED for 2 rounds.', details: 'A3/R1' },
      { id: 'leadership', name: 'Leadership', type: 'Action', description: 'Roll 1 combat dice. Allies within 2 spaces increase their Attack or Defense by 1 for 1 round on a HIT.' },
      { id: 'quick_draw', name: 'Quick Draw', type: 'Interrupt', description: 'Push target back 1 space for each HIT.', details: 'A3/R3', cooldown: '2 round CD' },
      { id: 'flare_x3', name: 'Flare x3', type: 'Interrupt', description: 'Place a Flare tile on the map. Enemies within 2 spaces cannot STEALTH. Treat as Light Source.', details: 'R6' },
    ],
  },
  // Add more characters here as needed
];


export function CharacterSheetUI() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [stats, setStats] = useState<CharacterStats>(charactersData[0].baseStats);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);

  useEffect(() => {
    const character = charactersData.find(c => c.id === selectedCharacterId);
    if (character) {
      setStats(character.baseStats);
    }
  }, [selectedCharacterId]);

  const handleCharacterChange = (id: string) => {
    setSelectedCharacterId(id);
  };

  const handleStatChange = (statName: StatName, value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setStats(prevStats => {
      const newStats = { ...prevStats, [statName]: numericValue };
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
    const character = charactersData.find(c => c.id === selectedCharacterId);
    if (character) {
      setStats(character.baseStats);
    }
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
              min="0"
            />
            <Button variant="outline" size="icon" onClick={() => incrementStat(def.id)} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isProgressStat && maxValue !== undefined && (
          <div className="mt-2">
            <Progress value={(currentValue / maxValue) * 100 || 0} className="h-3 [&>div]:bg-primary" />
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
                        min="0"
                    />
                </div>
            }
          </div>
        )}
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  const selectedCharacter = charactersData.find(c => c.id === selectedCharacterId) || charactersData[0];
  const abilities = selectedCharacter.abilities;
  const actionAbilities = abilities.filter(a => a.type === 'Action');
  const interruptAbilities = abilities.filter(a => a.type === 'Interrupt');
  const passiveAbilities = abilities.filter(a => a.type === 'Passive');

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <UserCircle className="mr-3 h-10 w-10 text-primary" />
                <CardTitle className="text-3xl">Character Sheet</CardTitle>
            </div>
            <Button variant="ghost" onClick={resetStats} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Stats
            </Button>
        </div>
        <CardDescription>Manage your character's attributes, abilities, and status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="characterName" className="text-lg font-medium">Character</Label>
          <Select value={selectedCharacterId} onValueChange={handleCharacterChange}>
            <SelectTrigger id="characterName" className="mt-1 text-xl p-2">
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              {charactersData.map(char => (
                <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator />

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statDefinitions.map(def => <StatInputComponent key={def.id} def={def} />)}
            </div>
          </TabsContent>
          <TabsContent value="abilities" className="mt-6">
            {abilities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">This character has no special abilities defined.</p>
            ) : (
              <div className="space-y-6">
                {actionAbilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center"><BookOpen className="mr-2 h-6 w-6 text-primary" /> Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {actionAbilities.map(ability => (
                        <Card key={ability.id} className="bg-card/60">
                          <CardHeader>
                            <CardTitle className="text-lg text-primary">{ability.name}</CardTitle>
                            {ability.details && <CardDescription className="text-xs">{ability.details}</CardDescription>}
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{ability.description}</p>
                            {ability.cooldown && <p className="text-xs text-amber-400 mt-1">Cooldown: {ability.cooldown}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {interruptAbilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center"><Zap className="mr-2 h-6 w-6 text-primary" /> Interrupts</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {interruptAbilities.map(ability => (
                        <Card key={ability.id} className="bg-card/60">
                          <CardHeader>
                            <CardTitle className="text-lg text-primary">{ability.name}</CardTitle>
                             {ability.details && <CardDescription className="text-xs">{ability.details}</CardDescription>}
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{ability.description}</p>
                            {ability.cooldown && <p className="text-xs text-amber-400 mt-1">Cooldown: {ability.cooldown}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {passiveAbilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-primary" /> Passives</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {passiveAbilities.map(ability => (
                        <Card key={ability.id} className="bg-card/60">
                          <CardHeader>
                            <CardTitle className="text-lg text-primary">{ability.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{ability.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </CardContent>
      <CardFooter className="flex justify-end pt-6">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-5 w-5" /> Save Character (Demo)
        </Button>
      </CardFooter>
    </Card>
  );
}

