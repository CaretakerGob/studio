
export type ShopItemCategory = 'Defense' | 'Melee Weapon' | 'Ranged Weapon' | 'Augment' | 'Utility' | 'Consumable' | 'Relic';
export type UtilitySubCategory = 'Ammunition' | 'Bombs' | 'Traps' | 'Healing' | 'Battery' | 'Miscellaneous';

export interface ShopItem {
  id: string;
  name: string;
  description: string; // Main effect or flavor text
  cost: number;
  imageUrl?: string;
  dataAiHint?: string;
  category: ShopItemCategory;
  subCategory?: UtilitySubCategory; // Specifically for Utility items
  stock?: number; // For consumables or limited items, default to unlimited if not set

  // Weapon-specific
  weaponClass?: string; // e.g., Blunt, Sword, Bow, Pistol
  attack?: string; // e.g., "A2", "A3/R4" (includes attack and range)
  
  // Utility/Consumable/Relic specific
  actionType?: 'Free Action' | 'Action' | 'Interrupt' | 'Passive';
  charges?: number | 'Battery'; // Number of uses or "Battery" for special recharge
  
  // Relic specific
  skillCheck?: string; // e.g., "Occult (5+)"
}
