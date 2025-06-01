
"use client";

import type { Ability, Character } from '@/types/character';
import { AbilityCard } from './ability-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Zap, ShieldAlert, ShoppingCart, Sparkles } from 'lucide-react';

interface AbilityWithCost extends Ability {
  cost: number;
}

interface CategorizedAbilities {
  actions: AbilityWithCost[];
  interrupts: AbilityWithCost[];
  passives: AbilityWithCost[];
  freeActions: AbilityWithCost[];
}

interface AbilitiesSectionProps {
  editableCharacterData: Character;
  allUniqueAbilities: AbilityWithCost[]; // This might become unused or simplified
  categorizedAbilities: CategorizedAbilities; // This might become unused or simplified
  abilityToAddId: string | undefined; // Unused
  setAbilityToAddId: (id: string | undefined) => void; // Unused
  handleAddAbilityToCustomCharacter: () => void; // Unused
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
  // allUniqueAbilities, // Unused parameter as custom character is removed
  // categorizedAbilities, // Unused parameter
  // abilityToAddId, // Unused
  // setAbilityToAddId, // Unused
  // handleAddAbilityToCustomCharacter, // Unused
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
  const freeActionAbilities = currentCharacterAbilities.filter(a => a.type === 'FREE Action');

  return (
    <>
      {/* Custom Ability Selection UI Removed */}

      {currentCharacterAbilities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 bg-card/50 rounded-md">This character has no special abilities defined.</p>
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
          {freeActionAbilities.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center"><Sparkles className="mr-2 h-6 w-6 text-primary" /> FREE Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {freeActionAbilities.map(ability => {
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
        </div>
      )}
    </>
  );
}
