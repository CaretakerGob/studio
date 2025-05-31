
"use client";

import type { ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Character, CharacterStatDefinition, CharacterStats, StatName } from '@/types/character';
import { Heart, Footprints, Shield, Brain, UserCircle, UserMinus as Minus, UserPlus as Plus, Settings, Droplets, AlertTriangle } from "lucide-react";

export const statDefinitions: CharacterStatDefinition[] = [
  { id: 'hp', label: "Health Points (HP)", icon: Heart, description: "Your character's vitality. Reaching 0 HP usually means defeat." },
  { id: 'sanity', label: "Sanity", icon: Brain, description: "Your character's mental stability. Low sanity can have dire consequences." },
  { id: 'mv', label: "Movement (MV)", icon: Footprints, description: "How many spaces your character can move." },
  { id: 'def', label: "Defense (DEF)", icon: Shield, description: "Reduces incoming damage." },
];

export const customStatPointBuyConfig: Record<Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>, { cost: number; max: number; base: number }> = {
  hp: { cost: 5, max: 7, base: 1 },
  sanity: { cost: 10, max: 5, base: 1 },
  mv: { cost: 2, max: 6, base: 1 },
  def: { cost: 5, max: 3, base: 1 },
};

const HEMORRHAGE_THRESHOLD = 3; // For BASE template (Hunters)

interface CoreStatsSectionProps {
  editableCharacterData: Character | null;
  effectiveBaseStats: CharacterStats;
  highlightedStat: StatName | null;
  handleStatChange: (statName: StatName, value: number | string) => void;
  incrementStat: (statName: StatName) => void;
  decrementStat: (statName: StatName) => void;
  currentBleedPoints: number;
  handleBleedPointsChange: (value: number | string) => void;
  incrementBleedPoints: () => void;
  decrementBleedPoints: () => void;
  handleBuyStatPoint: (statKey: Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>) => void;
  handleSellStatPoint: (statKey: Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>) => void;
  customStatPointBuyConfig: Record<Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>, { cost: number; max: number; base: number }>;
  sessionMaxHpModifier: number;
  sessionMaxSanityModifier: number;
  handleSessionMaxStatModifierChange: (statType: 'hp' | 'sanity', delta: number) => void;
}

export function CoreStatsSection({
  editableCharacterData,
  effectiveBaseStats,
  highlightedStat,
  handleStatChange,
  incrementStat,
  decrementStat,
  currentBleedPoints,
  handleBleedPointsChange,
  incrementBleedPoints,
  decrementBleedPoints,
  handleBuyStatPoint,
  handleSellStatPoint,
  customStatPointBuyConfig: propCustomStatPointBuyConfig,
  sessionMaxHpModifier,
  sessionMaxSanityModifier,
  handleSessionMaxStatModifierChange,
}: CoreStatsSectionProps) {

  if (!editableCharacterData) return null;

  const getStatProgressColorClass = (current: number | undefined, max: number | undefined): string => {
    if (current === undefined || current === null || max === undefined || max === null || max === 0) {
      return '[&>div]:bg-gray-400'; // Default color for undefined/error states
    }
    const percentage = (current / max) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = effectiveBaseStats[def.id] || 0;
    
    let effectiveMax = 0;
    let sessionModifier = 0;

    if (def.id === 'hp') {
      sessionModifier = sessionMaxHpModifier;
      effectiveMax = (effectiveBaseStats.maxHp || 0) + sessionModifier;
    } else if (def.id === 'sanity') {
      sessionModifier = sessionMaxSanityModifier;
      effectiveMax = (effectiveBaseStats.maxSanity || 0) + sessionModifier;
    } else {
       effectiveMax = currentValue; 
    }
    effectiveMax = Math.max(1, effectiveMax); 

    const progressColorClass = isProgressStat ? getStatProgressColorClass(currentValue, effectiveMax) : '[&>div]:bg-primary';


    return (
      <div className={cn("p-4 rounded-lg border border-border bg-card/50 shadow-md transition-all duration-300", highlightedStat === def.id ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
        <div className="flex flex-col items-start gap-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
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
              value={currentValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.id, e.target.value)}
              className="w-20 h-8 text-center text-lg font-bold"
              min="0"
            />
            <Button variant="outline" size="icon" onClick={() => incrementStat(def.id)} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isProgressStat && (
          <div className="mt-2">
            <Progress value={(currentValue / effectiveMax) * 100 || 0} className={cn("h-3", progressColorClass)} />
            <p className="text-xs text-muted-foreground text-right mt-1">{currentValue} / {effectiveMax}</p>
            
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-muted-foreground/20">
                <Label htmlFor={`maxMod-${def.id}`} className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                  <Settings className="mr-1 h-3 w-3"/> Max Mod:
                </Label>
                 <Button variant="outline" size="icon" onClick={() => handleSessionMaxStatModifierChange(def.id as 'hp' | 'sanity', -1)} className="h-6 w-6">
                    <Minus className="h-3 w-3" />
                </Button>
                <Input
                    id={`maxMod-${def.id}`}
                    type="number"
                    value={sessionModifier}
                    readOnly 
                    className="w-12 h-6 text-center text-sm font-bold p-0"
                />
                <Button variant="outline" size="icon" onClick={() => handleSessionMaxStatModifierChange(def.id as 'hp' | 'sanity', 1)} className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
          </div>
        )}
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  const CustomStatPointBuyComponent: React.FC<{
    statKey: Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>;
    label: string;
    Icon: React.ElementType;
   }> = ({ statKey, label, Icon }) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return null;

    const config = propCustomStatPointBuyConfig[statKey];
    const baseValueFromTemplate = editableCharacterData.baseStats[statKey]; 
    const currentCP = editableCharacterData.characterPoints || 0;


    let displayedValue = baseValueFromTemplate || 0; 
    let displayedMaxValue = 0;
    let sessionModifierValue = 0;


    if (statKey === 'hp') {
      sessionModifierValue = sessionMaxHpModifier;
      displayedMaxValue = (editableCharacterData.baseStats.maxHp || 0) + sessionModifierValue;
    } else if (statKey === 'sanity') {
      sessionModifierValue = sessionMaxSanityModifier;
      displayedMaxValue = (editableCharacterData.baseStats.maxSanity || 0) + sessionModifierValue;
    } else {
        displayedMaxValue = displayedValue; 
    }
    displayedMaxValue = Math.max(1, displayedMaxValue);


    const progressColorClass = (statKey === 'hp' || statKey === 'sanity') ? getStatProgressColorClass(displayedValue, displayedMaxValue) : '[&>div]:bg-primary';


    return (
      <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
        <div className="flex flex-col items-start gap-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
          <Label className="flex items-center text-lg font-medium">
            <Icon className="mr-2 h-6 w-6 text-primary" />
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleSellStatPoint(statKey)} disabled={baseValueFromTemplate <= 1} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 h-8 text-center text-lg font-bold flex items-center justify-center">{displayedValue}</span>
            <Button variant="outline" size="icon" onClick={() => handleBuyStatPoint(statKey)} disabled={baseValueFromTemplate >= config.max || currentCP < config.cost} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
         <p className="text-xs text-muted-foreground">Invested: {baseValueFromTemplate} / {config.max} | Cost: {config.cost} CP per point</p>
        {(statKey === 'hp' || statKey === 'sanity') && (
          <div className="mt-2">
            <Progress value={(displayedValue / displayedMaxValue) * 100 || 0} className={cn("h-3", progressColorClass)} />
            <p className="text-xs text-muted-foreground text-right mt-1">{displayedValue} / {displayedMaxValue}</p>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-muted-foreground/20">
                <Label htmlFor={`customMaxMod-${statKey}`} className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                  <Settings className="mr-1 h-3 w-3"/> Max Mod:
                </Label>
                 <Button variant="outline" size="icon" onClick={() => handleSessionMaxStatModifierChange(statKey as 'hp' | 'sanity', -1)} className="h-6 w-6">
                    <Minus className="h-3 w-3" />
                </Button>
                <Input
                    id={`customMaxMod-${statKey}`}
                    type="number"
                    value={sessionModifierValue}
                    readOnly
                    className="w-12 h-6 text-center text-sm font-bold p-0"
                />
                <Button variant="outline" size="icon" onClick={() => handleSessionMaxStatModifierChange(statKey as 'hp' | 'sanity', 1)} className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 flex items-center">
        <UserCircle className="mr-2 h-6 w-6 text-primary" /> Core Stats
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {editableCharacterData.id === 'custom' ? (
          <>
            {(Object.keys(propCustomStatPointBuyConfig) as Array<Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>>).map(statKey => {
                const statDef = statDefinitions.find(s => s.id === statKey);
                if (!statDef) return null;
                return (
                  <CustomStatPointBuyComponent
                    key={statKey}
                    statKey={statKey}
                    label={statDef.label}
                    Icon={statDef.icon}
                  />
                );
            })}
          </>
        ) : (
          statDefinitions.map(def => <StatInputComponent key={def.id} def={def} />)
        )}
        {/* Bleed Points Tracker */}
        <div className={cn("p-4 rounded-lg border border-border bg-card/50 shadow-md", currentBleedPoints >= HEMORRHAGE_THRESHOLD ? "border-destructive ring-2 ring-destructive" : "")}>
          <div className="flex flex-col items-start gap-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="bleedPoints" className="flex items-center text-lg font-medium">
              <Droplets className="mr-2 h-6 w-6 text-red-400" />
              Bleed Points
            </Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decrementBleedPoints} className="h-8 w-8">
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="bleedPoints"
                type="number"
                value={currentBleedPoints}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleBleedPointsChange(e.target.value)}
                className="w-20 h-8 text-center text-lg font-bold"
                min="0"
              />
              <Button variant="outline" size="icon" onClick={incrementBleedPoints} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Hemorrhage at: {HEMORRHAGE_THRESHOLD} points (Causes 3 damage)</p>
          {currentBleedPoints >= HEMORRHAGE_THRESHOLD && (
            <div className="mt-2 flex items-center text-destructive font-bold">
              <AlertTriangle className="mr-2 h-5 w-5" />
              HEMORRHAGE!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
    