
export type ArsenalItemCategory = 'WEAPON' | 'GEAR' | 'INTERRUPT' | 'PASSIVE' | 'ACTION' | 'LOAD OUT' | 'BONUS' | 'ELITE' | 'LOADOUT';

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
  effectStatChangeString?: string; 
  secondaryEffectStatChangeString?: string;
  weaponDetails?: string; 
  
  parsedStatModifiers?: ParsedStatModifier[];
  parsedWeaponStats?: { // Added to store parsed attack/range from weaponDetails
    attack?: number;
    range?: number;
    rawDetails?: string; // Store the original string for reference/display
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
