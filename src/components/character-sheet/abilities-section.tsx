
"use client";

import type { Ability, Character } from '@/types/character';
import { AbilityCard } from './ability-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Zap, ShieldAlert, ShoppingCart } from 'lucide-react';

interface AbilityWithCost extends Ability {
  cost: number;
}

interface CategorizedAbilities {
  actions: AbilityWithCost[];
  interrupts: AbilityWithCost[];
  passives: AbilityWithCost[];
}

interface AbilitiesSectionProps {
  editableCharacterData: Character;
  allUniqueAbilities: AbilityWithCost[];
  categorizedAbilities: CategorizedAbilities;
  abilityToAddId: string | undefined;
  setAbilityToAddId: (id: string | undefined) => void;
  handleAddAbilityToCustomCharacter: () => void;
  currentAbilityCooldowns: Record<string, number>;
  maxAbilityCooldowns: Record<string, number>;
  handleIncrementCooldown: (abilityId: string) => void;
  handleDecrementCooldown: (abilityId: string) => void;
  currentAbilityQuantities: Record<string, number>;
  maxAbilityQuantities: Record<string, number>;
  handleIncrementQuantity: (abilityId: string) => void;
  handleDecrementQuantity: (abilityId: string) => void;
}

export function AbilitiesSection({
  editableCharacterData,
  allUniqueAbilities,
  categorizedAbilities,
  abilityToAddId,
  setAbilityToAddId,
  handleAddAbilityToCustomCharacter,
  currentAbilityCooldowns,
  maxAbilityCooldowns,
  handleIncrementCooldown,
  handleDecrementCooldown,
  currentAbilityQuantities,
  maxAbilityQuantities,
  handleIncrementQuantity,
  handleDecrementQuantity,
}: AbilitiesSectionProps) {
  
  const currentCharacterAbilities = editableCharacterData?.abilities || [];
  const actionAbilities = currentCharacterAbilities.filter(a => a.type === 'Action');
  const interruptAbilities = currentCharacterAbilities.filter(a => a.type === 'Interrupt');
  const passiveAbilities = currentCharacterAbilities.filter(a => a.type === 'Passive');

  return (
    <>
      {editableCharacterData.id === 'custom' && (
        <>
          <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-lg bg-card/30 mb-6">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Custom Ability Selection
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
              <div className="w-full">
                <Label htmlFor="abilitySelect" className="text-sm text-muted-foreground">Choose an ability to add (Cost: 50 CP):</Label>
                <Select value={abilityToAddId} onValueChange={setAbilityToAddId}>
                  <SelectTrigger id="abilitySelect">
                    <SelectValue placeholder="Select an ability" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorizedAbilities.actions.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-base text-primary">Actions</SelectLabel>
                        {categorizedAbilities.actions.map(ability => (
                          <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                            {ability.name} ({ability.type}) - {ability.cost} CP
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {categorizedAbilities.interrupts.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-base text-primary">Interrupts</SelectLabel>
                        {categorizedAbilities.interrupts.map(ability => (
                          <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                            {ability.name} ({ability.type}) - {ability.cost} CP
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {categorizedAbilities.passives.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-base text-primary">Passives</SelectLabel>
                        {categorizedAbilities.passives.map(ability => (
                          <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                            {ability.name} ({ability.type}) - {ability.cost} CP
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddAbilityToCustomCharacter}
                disabled={!abilityToAddId || (editableCharacterData.characterPoints || 0) < (allUniqueAbilities.find(a=>a.id === abilityToAddId)?.cost || Infinity)}
                className="bg-primary hover:bg-primary/90"
              >
                Add Ability
              </Button>
            </div>
          </div>
          <Separator className="my-6" />
        </>
      )}

      {currentCharacterAbilities.length === 0 && editableCharacterData.id !== 'custom' ? (
        <p className="text-muted-foreground text-center py-8 bg-card/50 rounded-md">This character has no special abilities defined.</p>
      ) : currentCharacterAbilities.length === 0 && editableCharacterData.id === 'custom' ? (
        <p className="text-muted-foreground text-center py-8 bg-card/50 rounded-md">No abilities purchased yet for this custom character.</p>
      ) : (
        <div className="space-y-6">
          {actionAbilities.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center"><BookOpen className="mr-2 h-6 w-6 text-primary" /> Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {actionAbilities.map(ability => {
                    const isTrackableCooldown = ability.cooldown && maxAbilityCooldowns[ability.id] !== undefined && currentAbilityCooldowns[ability.id] !== undefined;
                    const isTrackableQuantity = ability.maxQuantity !== undefined && maxAbilityQuantities[ability.id] !== undefined && currentAbilityQuantities[ability.id] !== undefined;
                    return (
                        <AbilityCard
                        key={ability.id}
                        ability={ability}
                        currentCooldown={isTrackableCooldown ? currentAbilityCooldowns[ability.id] : undefined}
                        maxCooldown={isTrackableCooldown ? maxAbilityCooldowns[ability.id] : undefined}
                        onIncrementCooldown={isTrackableCooldown ? () => handleIncrementCooldown(ability.id) : undefined}
                        onDecrementCooldown={isTrackableCooldown ? () => handleDecrementCooldown(ability.id) : undefined}
                        currentQuantity={isTrackableQuantity ? currentAbilityQuantities[ability.id] : undefined}
                        maxQuantity={isTrackableQuantity ? maxAbilityQuantities[ability.id] : undefined}
                        onIncrementQuantity={isTrackableQuantity ? () => handleIncrementQuantity(ability.id) : undefined}
                        onDecrementQuantity={isTrackableQuantity ? () => handleDecrementQuantity(ability.id) : undefined}
                        />
                    );
                })}
              </div>
            </div>
          )}
          {interruptAbilities.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center"><Zap className="mr-2 h-6 w-6 text-primary" /> Interrupts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {interruptAbilities.map(ability => {
                   const isTrackableCooldown = ability.cooldown && maxAbilityCooldowns[ability.id] !== undefined && currentAbilityCooldowns[ability.id] !== undefined;
                   const isTrackableQuantity = ability.maxQuantity !== undefined && maxAbilityQuantities[ability.id] !== undefined && currentAbilityQuantities[ability.id] !== undefined;
                   return (
                        <AbilityCard
                            key={ability.id}
                            ability={ability}
                            currentCooldown={isTrackableCooldown ? currentAbilityCooldowns[ability.id] : undefined}
                            maxCooldown={isTrackableCooldown ? maxAbilityCooldowns[ability.id] : undefined}
                            onIncrementCooldown={isTrackableCooldown ? () => handleIncrementCooldown(ability.id) : undefined}
                            onDecrementCooldown={isTrackableCooldown ? () => handleDecrementCooldown(ability.id) : undefined}
                            currentQuantity={isTrackableQuantity ? currentAbilityQuantities[ability.id] : undefined}
                            maxQuantity={isTrackableQuantity ? maxAbilityQuantities[ability.id] : undefined}
                            onIncrementQuantity={isTrackableQuantity ? () => handleIncrementQuantity(ability.id) : undefined}
                            onDecrementQuantity={isTrackableQuantity ? () => handleDecrementQuantity(ability.id) : undefined}
                        />
                   );
                })}
              </div>
            </div>
          )}
          {passiveAbilities.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-primary" /> Passives</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passiveAbilities.map(ability => (
                   <AbilityCard key={ability.id} ability={ability} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
