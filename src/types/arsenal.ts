
export interface ArsenalCard {
  id: string;
  name: string; // This will now be the "Arsenal Name" e.g., "Closed Quarter Combatant"
  description?: string;
  hpMod?: number;
  maxHpMod?: number;
  mvMod?: number;
  defMod?: number;
  sanityMod?: number;
  maxSanityMod?: number;
  meleeAttackMod?: number;
  rangedAttackMod?: number;
  rangedRangeMod?: number;
  imageUrlFront?: string; // Added
  imageUrlBack?: string;  // Added
  // Future: Could include an array of specific weapons, gear, abilities if we expand to full relational model
}
