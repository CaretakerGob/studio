
"use client";

import type { ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Character, CharacterStatDefinition, CharacterStats, StatName } from '@/types/character';
import { Heart, Footprints, Shield, Brain, UserMinus as Minus, UserPlus as Plus, UserCircle } from "lucide-react"; // Assuming UserMinus and UserPlus are available

export const statDefinitions: CharacterStatDefinition[] = [
  { id: 'hp', label: "Health Points (HP)", icon: Heart, description: "Your character's vitality. Reaching 0 HP usually means defeat." },
  { id: 'sanity', label: "Sanity", icon: Brain, description: "Your character's mental stability. Low sanity can have dire consequences." },
  { id: 'mv', label: "Movement (MV)", icon: Footprints, description: "How many spaces your character can move." },
  { id: 'def', label: "Defense (DEF)", icon: Shield, description: "Reduces incoming damage." },
];

export const customStatPointBuyConfig: Record<Exclude<StatName, 'maxHp' | 'maxSanity'>, { cost: number; max: number; base: number }> = {
  hp: { cost: 5, max: 7, base: 1 },
  sanity: { cost: 10, max: 5, base: 1 },
  mv: { cost: 2, max: 6, base: 1 },
  def: { cost: 5, max: 3, base: 1 },
};


interface CoreStatsSectionProps {
  editableCharacterData: Character | null;
  effectiveBaseStats: CharacterStats;
  highlightedStat: StatName | null;
  handleStatChange: (statName: StatName, value: number | string) => void;
  incrementStat: (statName: StatName) => void;
  decrementStat: (statName: StatName) => void;
  handleBuyStatPoint: (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>) => void;
  handleSellStatPoint: (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>) => void;
  customStatPointBuyConfig: Record<Exclude<StatName, 'maxHp' | 'maxSanity'>, { cost: number; max: number; base: number }>;
}

export function CoreStatsSection({
  editableCharacterData,
  effectiveBaseStats,
  highlightedStat,
  handleStatChange,
  incrementStat,
  decrementStat,
  handleBuyStatPoint,
  handleSellStatPoint,
  customStatPointBuyConfig: propCustomStatPointBuyConfig, // Renamed to avoid conflict if needed
}: CoreStatsSectionProps) {

  if (!editableCharacterData) return null;

  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = effectiveBaseStats[def.id] || 0;
    const maxValue = def.id === 'hp' ? effectiveBaseStats.maxHp : (def.id === 'sanity' ? effectiveBaseStats.maxSanity : undefined);

    return (
      <div className={cn("p-4 rounded-lg border border-border bg-card/50 shadow-md transition-all duration-300", highlightedStat === def.id ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
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
                        min="1"
                    />
                </div>
            }
          </div>
        )}
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  const CustomStatPointBuyComponent: React.FC<{
    statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>;
    label: string;
    Icon: React.ElementType;
   }> = ({ statKey, label, Icon }) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return null;

    const config = propCustomStatPointBuyConfig[statKey]; // Use the prop here
    const baseValueFromTemplate = editableCharacterData.baseStats[statKey];
    const currentCP = editableCharacterData.characterPoints || 0;

    // This displayedValue calculation needs to reflect the effectiveBaseStats if we want to show arsenal impact.
    // For point-buy, we typically show the points *invested* by the user. Let's assume effectiveBaseStats IS what should be shown.
    let displayedValue = effectiveBaseStats[statKey] || 0;
    let displayedMaxValue = (statKey === 'hp' ? effectiveBaseStats.maxHp : (statKey === 'sanity' ? effectiveBaseStats.maxSanity : undefined )) || 0;
    
    // Ensure displayed value is not less than 1 after applying arsenal effects if base is 1
     if (baseValueFromTemplate >= 1) {
        displayedValue = Math.max(1, displayedValue);
        if (statKey === 'hp') displayedMaxValue = Math.max(1, effectiveBaseStats.maxHp || 0);
        if (statKey === 'sanity') displayedMaxValue = Math.max(1, effectiveBaseStats.maxSanity || 0);
    }


    return (
      <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
        <div className="flex items-center justify-between mb-2">
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
         <p className="text-xs text-muted-foreground">Base Points Invested: {baseValueFromTemplate} / {config.max} | Cost: {config.cost} CP per point</p>
        {(statKey === 'hp' || statKey === 'sanity') && (
          <div className="mt-2">
            <Progress value={(displayedValue / displayedMaxValue) * 100 || 0} className="h-3 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground text-right mt-1">{displayedValue} / {displayedMaxValue}</p>
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
            {(Object.keys(propCustomStatPointBuyConfig) as Array<Exclude<StatName, 'maxHp' | 'maxSanity'>>).map(statKey => {
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
      </div>
    </div>
  );
}

