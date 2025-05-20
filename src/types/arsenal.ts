
export type ArsenalItemCategory = 'WEAPON' | 'GEAR' | 'INTERRUPT' | 'PASSIVE' | 'ACTION' | 'LOAD OUT' | 'BONUS' | 'ELITE' | 'LOADOUT'; // Added LOADOUT based on sheet

// A simplified structure for parsed stat changes from strings like "Max HP +1"
export interface ParsedStatModifier {
  targetStat: string; // e.g., 'maxHp', 'def', 'meleeAttackMod'
  value: number;
}

export interface ArsenalItem {
  id: string; // Unique ID for the item within the arsenal context, e.g., arsenalName_itemName_rowNum
  category?: ArsenalItemCategory;
  level?: number;
  qty?: number;
  cd?: string;
  abilityName?: string; // This seems to be the primary name for the item/ability
  type?: string; // e.g., Shotgun, Armor
  class?: string; // e.g., Ranged weapon
  itemDescription?: string; // Renamed from 'description' to avoid conflict with ArsenalCard.description
  effect?: string;
  secondaryEffect?: string;
  toggle?: boolean;
  effectStatChangeString?: string; // Raw string e.g., "Max HP +1"
  secondaryEffectStatChangeString?: string;
  weaponDetails?: string; // e.g., "A4/R2 – Ranged Shotgun"
  
  // These will hold directly applicable character stat modifications
  parsedStatModifiers?: ParsedStatModifier[]; 
}

export interface ArsenalCard {
  id: string; // Unique ID for the Arsenal (e.g., "closed_quarter_combatant")
  name: string; // Display name (e.g., "Closed Quarter Combatant") - from "Arsenal Name" column
  description?: string; // Overall description of the Arsenal (if available as a separate field, or could be derived)
  imageUrlFront?: string;
  imageUrlBack?: string;
  items: ArsenalItem[]; // List of weapons, gear, abilities in this arsenal

  // Global stat mods for the arsenal card itself (if any, distinct from items)
  // We can keep these from the previous implementation if some arsenals have direct global buffs
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
