
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Enemy, ActiveEnemy, EnemyStatBlock, StatModifier, StatModifierName, EnemyVariation } from '@/types/mission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Map, ShieldAlert, UserPlus, UserMinus, Trash2, PlayCircle, Crosshair, Zap, Brain, Heart, SlidersHorizontal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';


interface MissionTrackerUIProps {
  initialEnemies: Enemy[];
}

// Helper function to apply stat modifiers
function applyStatModifiers(baseStats: EnemyStatBlock, modifiers: StatModifier[]): EnemyStatBlock {
  const newStats: EnemyStatBlock = JSON.parse(JSON.stringify(baseStats));

  // Ensure all potentially modifiable stats exist on newStats.
  newStats.hp = newStats.hp ?? 0; // Base HP from rulebook is MaxHP
  newStats.mv = newStats.mv ?? 0;
  newStats.def = newStats.def ?? 0;
  // Initialize san only if it's present in baseStats or a modifier targets it
  if (newStats.san === undefined && modifiers.some(mod => mod.stat === 'San' || mod.stat === 'MaxSanity')) {
    newStats.san = 0;
  }
  newStats.meleeAttackBonus = newStats.meleeAttackBonus ?? 0;
  newStats.rangedAttackBonus = newStats.rangedAttackBonus ?? 0;

  modifiers.forEach(mod => {
    switch (mod.stat) {
      case 'MaxHP':
      case 'HP':
        newStats.hp = (newStats.hp ?? 0) + mod.value;
        break;
      case 'MV':
        newStats.mv = (newStats.mv ?? 0) + mod.value;
        break;
      case 'Def':
        newStats.def = (newStats.def ?? 0) + mod.value;
        break;
      case 'MaxSanity':
      case 'San':
        newStats.san = (newStats.san ?? 0) + mod.value;
        break;
      case 'MeleeAttackBonus':
        newStats.meleeAttackBonus = (newStats.meleeAttackBonus ?? 0) + mod.value;
        break;
      case 'RangedAttackBonus':
        newStats.rangedAttackBonus = (newStats.rangedAttackBonus ?? 0) + mod.value;
        break;
    }
  });

  // Clamp values after all modifications
  if (newStats.hp !== undefined) newStats.hp = Math.max(1, newStats.hp);
  if (newStats.mv !== undefined) newStats.mv = Math.max(0, newStats.mv);
  if (newStats.def !== undefined) newStats.def = Math.max(0, newStats.def);
  if (newStats.san !== undefined) newStats.san = Math.max(0, newStats.san);
  
  newStats.meleeAttackBonus = newStats.meleeAttackBonus ?? 0;
  newStats.rangedAttackBonus = newStats.rangedAttackBonus ?? 0;

  return newStats;
}


export function MissionTrackerUI({ initialEnemies }: MissionTrackerUIProps) {
  const [enemiesList, setEnemiesList] = useState<Enemy[]>(initialEnemies);
  const [selectedEnemyIdToAdd, setSelectedEnemyIdToAdd] = useState<string | undefined>(undefined);
  const [activeEnemies, setActiveEnemies] = useState<ActiveEnemy[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setEnemiesList(initialEnemies);
  }, [initialEnemies]);

  const handleAddEnemyToEncounter = () => {
    if (!selectedEnemyIdToAdd) {
      toast({ title: "No Enemy Selected", description: "Please select an enemy from the list.", variant: "destructive" });
      return;
    }
    const enemyTemplate = enemiesList.find(e => e.id === selectedEnemyIdToAdd);
    if (!enemyTemplate) {
      toast({ title: "Error", description: "Selected enemy template not found.", variant: "destructive" });
      return;
    }

    const initialEffectiveStats = JSON.parse(JSON.stringify(enemyTemplate.baseStats));

    const newActiveEnemy: ActiveEnemy = {
      ...enemyTemplate, // Spreads base name, cp, template, baseStats, baseAttacks, logic, abilities, variations
      instanceId: `${enemyTemplate.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      effectiveStats: initialEffectiveStats, // Initial effective stats are the base stats
      currentHp: initialEffectiveStats.hp || 10, 
      currentSanity: initialEffectiveStats.san, 
      selectedVariationName: undefined, // No variation selected initially
    };

    setActiveEnemies(prev => [...prev, newActiveEnemy]);
    toast({ title: "Enemy Added", description: `${enemyTemplate.name} added to the encounter.` });
    setSelectedEnemyIdToAdd(undefined); 
  };

  const handleEnemyStatChange = (instanceId: string, stat: 'hp' | 'san', delta: number) => {
    setActiveEnemies(prevActiveEnemies => prevActiveEnemies.map(enemy => {
      if (enemy.instanceId === instanceId) {
        let newStatValue;
        let maxStatValue;

        if (stat === 'hp') {
          newStatValue = (enemy.currentHp || 0) + delta;
          maxStatValue = enemy.effectiveStats.hp || 0;
          newStatValue = Math.min(Math.max(0, newStatValue), maxStatValue);
          return { ...enemy, currentHp: newStatValue };
        } else if (stat === 'san') {
          if (enemy.effectiveStats.san === undefined) return enemy;
          newStatValue = (enemy.currentSanity ?? enemy.effectiveStats.san ?? 0) + delta;
          maxStatValue = enemy.effectiveStats.san ?? 0;
          newStatValue = Math.min(Math.max(0, newStatValue), maxStatValue);
          return { ...enemy, currentSanity: newStatValue };
        }
      }
      return enemy;
    }));
  };

  const handleRemoveEnemyFromEncounter = (instanceId: string) => {
    const enemyToRemove = activeEnemies.find(e => e.instanceId === instanceId);
    setActiveEnemies(prev => prev.filter(enemy => enemy.instanceId !== instanceId));
    if(enemyToRemove) {
        const displayName = enemyToRemove.selectedVariationName || enemyToRemove.name;
        toast({ title: "Enemy Removed", description: `${displayName} removed from encounter.`, variant: "destructive" });
    }
  };

  const handleVariationChange = (instanceId: string, newVariationName: string | undefined) => {
    setActiveEnemies(prevActiveEnemies => prevActiveEnemies.map(enemy => {
      if (enemy.instanceId === instanceId) {
        const originalTemplate = enemiesList.find(e => e.id === enemy.id);
        if (!originalTemplate) return enemy; 

        let newEffectiveStats = JSON.parse(JSON.stringify(originalTemplate.baseStats));
        
        if (newVariationName && newVariationName !== "Base") {
          const selectedVariationDefinition = originalTemplate.variations?.find(v => v.name === newVariationName);
          if (selectedVariationDefinition) {
            newEffectiveStats = applyStatModifiers(newEffectiveStats, selectedVariationDefinition.statChanges);
          }
        }
        
        const newCurrentHp = newEffectiveStats.hp || 0;
        const newCurrentSanity = newEffectiveStats.san; 

        return { 
          ...enemy, 
          selectedVariationName: newVariationName === "Base" ? undefined : newVariationName, 
          effectiveStats: newEffectiveStats,
          currentHp: newCurrentHp,
          currentSanity: newCurrentSanity
        };
      }
      return enemy;
    }));
    
    const enemyInstance = activeEnemies.find(e => e.instanceId === instanceId);
    const baseName = enemyInstance?.name;
    const variationDisplay = newVariationName === "Base" || !newVariationName ? "Base" : newVariationName;
    
    toast({
        title: "Variation Changed",
        description: `${baseName || 'Enemy'}'s form set to ${variationDisplay}. Stats updated.`,
      });
  };
  
  const getStatProgressColorClass = (current: number | undefined, max: number | undefined, type: 'hp' | 'san'): string => {
    if (current === undefined || current === null || max === undefined || max === null || max === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (current / max) * 100;
    if (type === 'hp') {
        if (percentage <= 33) return '[&>div]:bg-red-500';
        if (percentage <= 66) return '[&>div]:bg-yellow-500';
        return '[&>div]:bg-green-500';
    }
    if (type === 'san') { 
        if (percentage <= 33) return '[&>div]:bg-red-600'; 
        if (percentage <= 66) return '[&>div]:bg-indigo-400';
        return '[&>div]:bg-blue-500';
    }
    return '[&>div]:bg-primary';
  };


  if (initialEnemies.length === 0 || (initialEnemies.length === 1 && initialEnemies[0].id === 'parser-error-indicator')) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mission Tracker Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">
                    {initialEnemies[0]?.baseAttacks[0]?.details || "Failed to load enemy data from the Horror Journal. Please check the file and server logs."}
                </p>
            </CardContent>
        </Card>
    );
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <Card className="lg:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Map className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Mission Setup</CardTitle>
          </div>
          <CardDescription>Configure your mission and add enemies to the encounter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-muted/30">
            <h4 className="font-semibold text-lg mb-2">Current Hunt/Objective</h4>
            <p className="text-sm text-muted-foreground"> (Hunt selection and objective tracking will be added here.)</p>
          </div>
          <Separator />
          <div>
            <Label htmlFor="enemy-select" className="text-md font-medium">Add Enemy to Encounter</Label>
            <div className="flex items-center gap-2 mt-1">
              <Select value={selectedEnemyIdToAdd} onValueChange={setSelectedEnemyIdToAdd}>
                <SelectTrigger id="enemy-select" className="flex-grow">
                  <SelectValue placeholder="Select an enemy..." />
                </SelectTrigger>
                <SelectContent>
                  {enemiesList.sort((a,b) => a.name.localeCompare(b.name)).map(enemy => (
                    <SelectItem key={enemy.id} value={enemy.id}>
                      {enemy.name} (CP: {enemy.cp || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddEnemyToEncounter} disabled={!selectedEnemyIdToAdd}>
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-xl">
        <CardHeader>
           <div className="flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Active Encounter</CardTitle>
          </div>
          <CardDescription>Manage enemies currently in combat.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnemies.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No enemies in the current encounter. Add some from the setup panel.</p>
          ) : (
            <ScrollArea className="h-[60vh] pr-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEnemies.map(enemy => {
                  const displayName = enemy.selectedVariationName || enemy.name;
                  return (
                    <Card key={enemy.instanceId} className="bg-card/50 border-border relative group">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-primary">{displayName}</CardTitle>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveEnemyFromEncounter(enemy.instanceId)}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          CP: {enemy.cp || 'N/A'} | Base Template: {enemy.template || 'N/A'}
                          {enemy.selectedVariationName && ` (Original: ${enemy.name})`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 space-y-3">
                        {enemy.variations && enemy.variations.length > 0 && (
                          <div className="mt-1">
                            <Label htmlFor={`variation-select-${enemy.instanceId}`} className="text-xs text-muted-foreground">Form/Variation:</Label>
                            <Select
                              value={enemy.selectedVariationName || "Base"}
                              onValueChange={(value) => handleVariationChange(enemy.instanceId, value === "Base" ? undefined : value)}
                            >
                              <SelectTrigger id={`variation-select-${enemy.instanceId}`} className="h-8 text-xs">
                                <SelectValue placeholder="Select Variation..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Base">Base ({enemy.name})</SelectItem>
                                {enemy.variations.map(v => (
                                  <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`hp-${enemy.instanceId}`} className="flex items-center text-sm">
                                <Heart className="mr-1.5 h-4 w-4 text-red-500" /> HP:
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'hp', -1)}><UserMinus className="h-3 w-3" /></Button>
                              <Input id={`hp-${enemy.instanceId}`} type="number" value={enemy.currentHp} readOnly className="w-12 h-6 text-center text-sm" />
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'hp', 1)}><UserPlus className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          <Progress value={(enemy.currentHp / (enemy.effectiveStats.hp || 1)) * 100} className={cn("h-1.5 mt-1", getStatProgressColorClass(enemy.currentHp, enemy.effectiveStats.hp, 'hp'))} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{enemy.currentHp} / {enemy.effectiveStats.hp || 'N/A'}</p>
                        </div>
                        
                        {enemy.effectiveStats.san !== undefined && (
                          <div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`san-${enemy.instanceId}`} className="flex items-center text-sm">
                                  <Brain className="mr-1.5 h-4 w-4 text-blue-400" /> Sanity:
                              </Label>
                               <div className="flex items-center gap-1">
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'san', -1)}><UserMinus className="h-3 w-3" /></Button>
                                  <Input id={`san-${enemy.instanceId}`} type="number" value={enemy.currentSanity ?? enemy.effectiveStats.san ?? ''} readOnly className="w-12 h-6 text-center text-sm" />
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'san', 1)}><UserPlus className="h-3 w-3" /></Button>
                               </div>
                            </div>
                            <Progress value={((enemy.currentSanity ?? enemy.effectiveStats.san ?? 0) / (enemy.effectiveStats.san || 1)) * 100} className={cn("h-1.5 mt-1", getStatProgressColorClass(enemy.currentSanity ?? enemy.effectiveStats.san, enemy.effectiveStats.san, 'san'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">
                              {enemy.currentSanity ?? enemy.effectiveStats.san ?? 'N/A'} / {enemy.effectiveStats.san ?? 'N/A'}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t pt-2 mt-2">
                          <p><Zap className="inline h-3 w-3 mr-1 text-yellow-400"/>MV: {enemy.effectiveStats.mv ?? 'N/A'}</p>
                          <p><ShieldAlert className="inline h-3 w-3 mr-1 text-gray-400"/>DEF: {enemy.effectiveStats.def ?? 'N/A'}</p>
                        </div>

                        {enemy.effectiveStats.armor && (
                          <div className="text-xs border-t pt-2 mt-2">
                              <p className="font-medium">Armor: {enemy.effectiveStats.armor.name}</p>
                              <p className="text-muted-foreground">Effect: {enemy.effectiveStats.armor.effect}</p>
                          </div>
                        )}
                         {enemy.baseAttacks.length > 0 && (
                          <div className="text-xs border-t pt-2 mt-2">
                              <p className="font-medium">Base Attacks:</p>
                              {enemy.baseAttacks.map((atk, idx) => {
                                  let attackDisplayDetails = atk.details;
                                  let bonusText = "";
                                  if (atk.type.toLowerCase().includes('melee') && enemy.effectiveStats.meleeAttackBonus && enemy.effectiveStats.meleeAttackBonus !== 0) { 
                                      bonusText = ` (${enemy.effectiveStats.meleeAttackBonus > 0 ? '+' : ''}${enemy.effectiveStats.meleeAttackBonus} Bonus)`;
                                  } else if (atk.type.toLowerCase().includes('range') && enemy.effectiveStats.rangedAttackBonus && enemy.effectiveStats.rangedAttackBonus !== 0) {
                                      bonusText = ` (${enemy.effectiveStats.rangedAttackBonus > 0 ? '+' : ''}${enemy.effectiveStats.rangedAttackBonus} Bonus)`;
                                  }
                                  return (
                                  <p key={idx} className="text-muted-foreground">
                                      <Crosshair className="inline h-3 w-3 mr-1 text-green-400"/> {atk.type}: {attackDisplayDetails}{bonusText}
                                  </p>
                                  );
                              })}
                          </div>
                         )}
                         {enemy.logic && (
                          <div className="text-xs border-t pt-2 mt-2">
                              <p className="font-medium">Logic: <span className="text-muted-foreground">{enemy.logic.condition}</span></p>
                          </div>
                         )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

