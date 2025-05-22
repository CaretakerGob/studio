
import type { CharacterStats } from '@/types/character';

export type ArsenalItemCategory = 'WEAPON' | 'GEAR' | 'INTERRUPT' | 'PASSIVE' | 'ACTION' | 'LOAD OUT' | 'LOADOUT' | 'BONUS' | 'ELITE';

export interface ParsedStatModifier {
  targetStat: string;
  value: number;
}

export interface ArsenalItem {
  id: string;
  category?: ArsenalItemCategory;
  level?: number;
  qty?: number;
  cd?: string;
  abilityName?: string;
  type?: string;
  class?: string;
  itemDescription?: string;
  effect?: string;
  secondaryEffect?: string;
  toggle?: boolean;
  isFlaggedAsWeapon?: boolean;
  effectStatChangeString?: string;
  secondaryEffectStatChangeString?: string;
  weaponDetails?: string;

  parsedStatModifiers?: ParsedStatModifier[];
  parsedWeaponStats?: {
    attack?: number;
    range?: number;
    rawDetails?: string;
  };

  // Companion/Pet related fields
  isPet?: boolean;
  petName?: string;
  petStats?: string; // Raw string from sheet
  petAbilities?: string;
  parsedPetCoreStats?: Partial<CharacterStats>; // Parsed HP, MaxHP, MV, DEF, Sanity, MaxSanity

  // Flags for ability types
  isAction?: boolean;
  isInterrupt?: boolean;
  isPassive?: boolean;
  isFreeAction?: boolean;
}

export interface ArsenalCard {
  id: string;
  name: string;
  description?: string;
  imageUrlFront?: string;
  imageUrlBack?: string;
  items: ArsenalItem[];

  hpMod?: number;
  maxHpMod?: number;
  mvMod?: number;
  defMod?: number;
  sanityMod?: number;
  maxSanityMod?: number;
  meleeAttackMod?: number;
  rangedAttackMod?: number;
  rangedRangeMod?: number;
}
