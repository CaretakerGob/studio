
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number; // Assuming 'Crypto' or a generic currency
  imageUrl?: string;
  dataAiHint?: string;
  category?: 'Gear' | 'Weapon' | 'Consumable' | 'Augment' | 'Utility' | 'Relic';
  stock?: number; // Optional: for limited stock items
}
