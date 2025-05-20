
"use client";

import type { Weapon, RangedWeapon } from '@/types/character';
import type { ArsenalCard } from '@/types/arsenal';
import { Swords, Crosshair } from 'lucide-react';

interface WeaponDisplayProps {
  weapon?: Weapon | RangedWeapon;
  type: 'melee' | 'ranged';
  equippedArsenalCard?: ArsenalCard | null;
  baseMeleeWeaponName?: string | null; // To help decide if default "Fists" should be hidden
  baseRangedWeaponName?: string | null; // To help decide if default "None" should be hidden
}

export function WeaponDisplay({ weapon, type, equippedArsenalCard, baseMeleeWeaponName, baseRangedWeaponName }: WeaponDisplayProps) {
  if (!weapon) return null;

  // Hide default "Fists" if no character melee weapon and no arsenal melee weapon/mod
  if (type === 'melee' && weapon.name === "Fists" && weapon.attack === 1 && !baseMeleeWeaponName && !equippedArsenalCard?.meleeAttackMod && !equippedArsenalCard?.items.some(i => (i.isFlaggedAsWeapon || i.category?.toUpperCase() === 'LOAD OUT') && i.parsedWeaponStats?.attack !== undefined && !(i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0))) {
    return null;
  }
  // Hide default "None" for ranged if no character ranged weapon and no arsenal ranged weapon/mod
  if (type === 'ranged' && weapon.name === "None" && weapon.attack === 0 && (weapon as RangedWeapon).range === 0 && !baseRangedWeaponName && !equippedArsenalCard?.rangedAttackMod && !equippedArsenalCard?.rangedRangeMod && !equippedArsenalCard?.items.some(i => (i.isFlaggedAsWeapon || i.category?.toUpperCase() === 'LOAD OUT') && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0))) {
    return null;
  }


  const Icon = type === 'melee' ? Swords : Crosshair;
  const isRanged = 'range' in weapon && weapon.range !== undefined && weapon.range > 0;

  return (
    <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
      <div className="flex items-center mb-2">
        <Icon className="mr-2 h-6 w-6 text-primary" />
        <h4 className="text-lg font-medium">{type === 'melee' ? "Melee Weapon" : "Ranged Weapon"}</h4>
      </div>
      <p><span className="font-semibold">Name:</span> {weapon.name}</p>
      <p><span className="font-semibold">ATK:</span> {weapon.attack}</p>
      {isRanged && <p><span className="font-semibold">RNG:</span> {(weapon as RangedWeapon).range}</p>}
      {weapon.flavorText && <p className="text-xs text-muted-foreground mt-1">{weapon.flavorText}</p>}
      {type === 'ranged' && isRanged && <p className="text-sm text-primary mt-1">Formatted: A{weapon.attack}/R{(weapon as RangedWeapon).range}</p>}
      {type === 'melee' && !isRanged && <p className="text-sm text-primary mt-1">{weapon.attack} attack dmg</p>}
    </div>
  );
}
