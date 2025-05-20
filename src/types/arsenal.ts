
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
  isFlaggedAsWeapon?: boolean; // New: To specifically flag an item as a weapon if "Weapon" column is TRUE
  effectStatChangeString?: string; 
  secondaryEffectStatChangeString?: string;
  weaponDetails?: string; // Stores the A/R string like "A4/R2"
  
  parsedStatModifiers?: ParsedStatModifier[];
  parsedWeaponStats?: { 
    attack?: number;
    range?: number;
    rawDetails?: string; 
  };
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

