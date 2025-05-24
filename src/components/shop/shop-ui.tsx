
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ShopItem } from '@/types/shop';
import { Store, ShoppingCart, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const sampleShopItems: ShopItem[] = [
  { id: 'item_medkit', name: 'Trauma Kit', description: 'Advanced medical supplies. Heals 3 HP. Single use.', cost: 150, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'medical kit', category: 'Consumable', stock: 5 },
  { id: 'item_ammo_pack', name: 'Hollow Point Rounds (Box)', description: '+1 Damage for ranged attacks for one encounter.', cost: 200, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ammo box', category: 'Consumable', stock: 3 },
  { id: 'item_combat_knife', name: 'Kukri', description: 'A reliable curved blade. Melee: A2.', cost: 350, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'combat knife', category: 'Weapon' },
  { id: 'item_flashlight_mod', name: 'Weapon-Mounted Light', description: 'Attaches to a ranged weapon, illuminates target area.', cost: 250, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'tactical light', category: 'Augment' },
  { id: 'item_energy_bar', name: 'Stim-Pack', description: 'High-energy concoction. Grants +1 MV for one turn.', cost: 75, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'energy bar', category: 'Consumable', stock: 10 },
  { id: 'item_cursed_charm', name: 'Warding Pendant', description: 'A small, unsettling charm. Provides +1 to Sanity checks against fear effects.', cost: 400, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ancient charm', category: 'Relic' },
  { id: 'item_reinforced_vest', name: 'Ballistic Vest', description: 'Offers basic protection. +1 DEF.', cost: 600, imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'bulletproof vest', category: 'Gear' },
];

export function ShopUI() {
  const { toast } = useToast();
  const [playerCrypto, setPlayerCrypto] = useState(1000); // Simulated player currency
  const [inventory, setInventory] = useState<ShopItem[]>(sampleShopItems);

  const handleBuyItem = (itemToBuy: ShopItem) => {
    if (playerCrypto < itemToBuy.cost) {
      toast({
        title: "Insufficient Funds",
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
          item.id === itemToBuy.id ? { ...item, stock: item.stock! - 1 } : item
        )
      );
    }

    toast({
      title: "Purchase Successful!",
      description: `You bought ${itemToBuy.name} for ${itemToBuy.cost} Crypto.`,
    });
    // Here you would typically add the item to the player's inventory
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center mb-2">
            <Store className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-4xl font-bold">Whispers & Wares</CardTitle>
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

          <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-25rem)] pr-3"> {/* Adjust height as needed */}
            {inventory.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">The shop is currently empty. Check back later!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {inventory.map((item) => (
                  <Card key={item.id} className="flex flex-col bg-card/80 hover:shadow-primary/30 transition-shadow">
                    <CardHeader className="p-3">
                      {item.imageUrl && (
                        <div className="relative w-full h-32 md:h-40 mb-2 rounded overflow-hidden border border-border">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                          />
                        </div>
                      )}
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.category && <Badge variant="outline" className="mt-1 w-fit">{item.category}</Badge>}
                    </CardHeader>
                    <CardContent className="flex-grow p-3 pt-0">
                      <p className="text-sm text-muted-foreground text-pretty">{item.description}</p>
                    </CardContent>
                    <CardFooter className="p-3 flex flex-col items-start space-y-2">
                       <div className="w-full flex justify-between items-center">
                        <p className="text-lg font-semibold text-primary">{item.cost} Crypto</p>
                        {item.stock !== undefined && (
                            <Badge variant={item.stock > 0 ? "secondary" : "destructive"}>
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
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
