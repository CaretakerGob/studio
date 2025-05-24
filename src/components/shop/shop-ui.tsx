
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ShopItem } from '@/types/shop';
import { Store, ShoppingCart, Coins, ShieldAlert, Swords, Crosshair, WandSparkles, Construction, Droplets, HelpCircle, Zap, Flame, Bomb, Ambulance, BatteryCharging, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Placeholder for a comprehensive shop inventory.
// Due to length, only a small sample is included here.
// The user should populate this with all items from their rulebook.
const shopInventory: ShopItem[] = [
  // Defense Gear
  { id: 'def_riot_shield', name: 'Riot Shield', cost: 4, description: '-2 damage from Range Attacks.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'riot shield' },
  { id: 'def_body_armor', name: 'Body Armor', cost: 4, description: '-2 damage from Melee Attacks.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'body armor' },
  { id: 'def_helmet', name: 'Helmet', cost: 6, description: 'Lower damage received by Critical Hits by 2.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'helmet' },
  
  // Melee Weapons
  { id: 'melee_bat', name: 'Bat', cost: 2, weaponClass: 'Blunt', attack: 'A2', description: 'Standard bat. Blunt Class: Armor Breaker (PASSIVE) - Re-roll 1 of the targets Defense Dice.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'baseball bat' },
  { id: 'melee_crowbar', name: 'Crowbar', cost: 6, weaponClass: 'Blunt', attack: 'A3', description: 'Critical Hits inflict FLINCH for 1 turn. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'crowbar' },

  // Ranged Weapons
  { id: 'ranged_shortbow', name: 'Shortbow', cost: 3, weaponClass: 'Bow', attack: 'A2/R4', description: 'Standard shortbow. Bow Class: Piercing (PASSIVE) - Damaged enemies take 1 point of BLEED.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'shortbow' },
  { id: 'ranged_longbow', name: 'Longbow', cost: 7, weaponClass: 'Bow', attack: 'A3/R4', description: 'Standard longbow. Bow Class: Piercing.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'longbow' },
  
  // Augments
  { id: 'aug_swiss_army_knife', name: 'Swiss Army Knife', cost: 6, description: '+2 when attempting an Engineering skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'swiss army knife' },
  { id: 'aug_ninja_mask', name: 'Ninja mask', cost: 6, description: '+2 when attempting a Deception skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ninja mask' },

  // Utility - Ammunition
  { id: 'util_ammo_incendiary', name: 'Incendiary Ammo', actionType: 'Free Action', cost: 2, charges: 3, description: 'Element of Range Attack is now FIRE for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fire bullets' },
  { id: 'util_ammo_taze_tipped', name: 'Taze Tipped', actionType: 'Free Action', cost: 3, charges: 3, description: 'Element of Range Attack is now ELEC for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'electric bullets' },
  
  // Utility - Bombs
  { id: 'util_bomb_pipe', name: 'Pipe bomb', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A2/R4 - AOE', description: 'PHYSICAL bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'pipe bomb' },

  // Utility - Traps
  { id: 'util_trap_net', name: 'Net Trap', actionType: 'Action', cost: 3, charges: 2, description: 'Target is afflicted by Immobilize of 10. TRIGGER - Enemy unit moves on Trap Icon.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'net trap' },

  // Utility - Healing
  { id: 'util_heal_espresso', name: 'Espresso Shot', actionType: 'Interrupt', cost: 3, charges: 2, description: 'Restore 1 HP, +1 Movement for 2 turns.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'espresso shot' },

  // Utility - Battery
  { id: 'util_battery_flashlight', name: 'Flash Light', actionType: 'Interrupt', cost: 0, charges: 'Battery', description: 'Treat the map tile this character is on as a Light Score of 1. This character cannot use any Interrupts while the Flash Light is on.', category: 'Utility', subCategory: 'Battery', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'flashlight' },
  
  // Utility - Miscellaneous
  { id: 'util_misc_glow_stick', name: 'Glow Stick', actionType: 'Action', cost: 1, charges: 2, description: 'Treat as Light Source for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'glow stick' },

  // Consumables
  { id: 'consum_blessed_glow_sticks', name: 'Blessed Glow Sticks', actionType: 'Interrupt', cost: 2, charges: 1, stock: 1, description: 'R6 -Place 1 Light Source on any map tile. These Light Sources cannot be destroyed.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'blessed glow sticks' },
  { id: 'consum_frag_grenade_pro', name: 'Frag Grenade - Pro', actionType: 'Action', cost: 2, charges: 1, stock: 1, attack: 'A6/R4 – PHYSICAL- AOE 2 spaces from target', description: 'Professional grade fragmentation grenade.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'frag grenade' },

  // Relics
  { id: 'relic_constantines_lighter', name: 'Constantine\'s Lighter', cost: 6, skillCheck: 'I-5; II-8', actionType: 'Action', description: 'I - Treat the tile this unit is on as a Light Score of 1. Lasts 4 turns. II - Draw on the energy of another Light Source on the Map and move it to the tile of your choice.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magic lighter' },
  { id: 'relic_exorcists_cross', name: 'Exorcists Cross', cost: 6, skillCheck: '5', actionType: 'Action', description: 'Instantly destroy 1 Poltergeist or Phantasm.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'exorcist cross' },
  
  // ... (ADD ALL OTHER ITEMS FROM RULEBOOK HERE)
];

const categoryIcons: Record<ShopItem['category'], React.ElementType> = {
  'Defense': ShieldAlert,
  'Melee Weapon': Swords,
  'Ranged Weapon': Crosshair,
  'Augment': WandSparkles,
  'Utility': Construction,
  'Consumable': Droplets,
  'Relic': HelpCircle, // Or a more mystical icon if available
};

const subCategoryIcons: Record<NonNullable<ShopItem['subCategory']>, React.ElementType> = {
  'Ammunition': Crosshair, // Re-using, or could be more specific
  'Bombs': Bomb,
  'Traps': Zap, // Representing a triggered trap
  'Healing': Ambulance,
  'Battery': BatteryCharging,
  'Miscellaneous': Puzzle,
};


export function ShopUI() {
  const { toast } = useToast();
  const [playerCrypto, setPlayerCrypto] = useState(2000); // Simulated player currency
  const [inventory, setInventory] = useState<ShopItem[]>(shopInventory.map(item => ({
    ...item,
    // Initialize stock for consumables if not set, others are unlimited by default
    stock: item.category === 'Consumable' && item.stock === undefined ? (item.charges || 1) : item.stock,
  })));

  const handleBuyItem = (itemToBuy: ShopItem) => {
    if (playerCrypto < itemToBuy.cost) {
      toast({
        title: "Insufficient Crypto",
        description: `You need ${itemToBuy.cost} Crypto for ${itemToBuy.name}, but you only have ${playerCrypto}.`,
        variant: "destructive",
      });
      return;
    }

    if (itemToBuy.stock !== undefined && itemToBuy.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${itemToBuy.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    setPlayerCrypto(prevCrypto => prevCrypto - itemToBuy.cost);
    
    if (itemToBuy.stock !== undefined) {
      setInventory(prevInv => 
        prevInv.map(item => 
          item.id === itemToBuy.id ? { ...item, stock: Math.max(0, item.stock! - 1) } : item
        )
      );
    }

    toast({
      title: "Purchase Successful!",
      description: `You bought ${itemToBuy.name} for ${itemToBuy.cost} Crypto.`,
    });
    // Here you would typically add the item to the player's persistent inventory
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center mb-2">
            <Store className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-4xl font-bold">Whispers &amp; Wares</CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            Uncommon goods for the discerning hunter. Spend your hard-earned Crypto.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-end items-center mb-6 p-3 bg-card rounded-lg shadow">
            <Coins className="h-6 w-6 text-yellow-400 mr-2" />
            <span className="text-xl font-semibold">Your Crypto: {playerCrypto}</span>
          </div>

          <ScrollArea className="h-[calc(100vh-22rem)] md:h-[calc(100vh-27rem)] pr-3">
            {inventory.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">The shop is currently empty. Check back later!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {inventory.map((item) => {
                  const IconForCategory = categoryIcons[item.category] || HelpCircle;
                  const IconForSubCategory = item.subCategory ? subCategoryIcons[item.subCategory] : null;

                  return (
                    <Card key={item.id} className="flex flex-col bg-card/80 hover:shadow-primary/30 transition-shadow">
                      <CardHeader className="p-3">
                        {item.imageUrl && (
                          <div className="relative w-full h-32 md:h-36 mb-2 rounded overflow-hidden border border-border bg-muted/30">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              style={{ objectFit: 'contain' }}
                              data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md leading-tight">{item.name}</CardTitle>
                          <IconForCategory className="h-5 w-5 text-primary/70 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          {item.subCategory && <Badge variant="outline" className="text-xs">{item.subCategory}</Badge>}
                          {IconForSubCategory && <IconForSubCategory className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow p-3 pt-0 space-y-1 text-xs">
                        <p className="text-muted-foreground text-pretty">{item.description}</p>
                        {item.weaponClass && <p><span className="font-semibold">Class:</span> {item.weaponClass}</p>}
                        {item.attack && <p><span className="font-semibold">Attack:</span> {item.attack}</p>}
                        {item.actionType && <p><span className="font-semibold">Type:</span> {item.actionType}</p>}
                        {item.charges && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                        {item.skillCheck && <p><span className="font-semibold">Skill Check:</span> {item.skillCheck}</p>}
                      </CardContent>
                      <CardFooter className="p-3 flex flex-col items-start space-y-2 border-t mt-auto">
                         <div className="w-full flex justify-between items-center">
                          <p className="text-lg font-semibold text-primary">{item.cost} Crypto</p>
                          {item.stock !== undefined && (
                              <Badge variant={item.stock > 0 ? "default" : "destructive"} className="bg-primary/10 text-primary-foreground border-primary text-xs">
                              {item.stock > 0 ? `Stock: ${item.stock}` : "Out of Stock"}
                              </Badge>
                          )}
                         </div>
                        <Button
                          onClick={() => handleBuyItem(item)}
                          className="w-full bg-primary hover:bg-primary/80"
                          disabled={(item.stock !== undefined && item.stock <= 0) || playerCrypto < item.cost}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" /> Buy Item
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
