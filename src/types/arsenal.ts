
export interface ArsenalCard {
  id: string;
  name: string;
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
  // Add other potential mods as needed, e.g., skillMod?: number;
}
