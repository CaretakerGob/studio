
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ShopItem, ShopItemCategory, UtilitySubCategory } from '@/types/shop';
import { Store, ShoppingCart, Coins, ShieldAlert, Swords, Crosshair, WandSparkles, Construction, Droplets, HelpCircle, Zap, Flame, Bomb, Ambulance, BatteryCharging, Puzzle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Removed: import { generateShopItemImage } from '@/ai/flows/generate-shop-item-image-flow';
// Removed: import { Loader2, ImageIcon } from 'lucide-react'; (ImageIcon might still be used by placeholder logic, Loader2 not)

interface ShopUIProps {
  initialInventory: ShopItem[];
}

const categoryIcons: Record<ShopItemCategory, React.ElementType> = {
  'Defense': ShieldAlert,
  'Melee Weapon': Swords,
  'Ranged Weapon': Crosshair,
  'Augment': WandSparkles,
  'Utility': Construction,
  'Consumable': Droplets,
  'Relic': HelpCircle,
};

const utilitySubCategoryIcons: Record<UtilitySubCategory, React.ElementType> = {
  'Ammunition': Crosshair,
  'Bombs': Bomb,
  'Traps': Zap,
  'Healing': Ambulance,
  'Battery': BatteryCharging,
  'Miscellaneous': Puzzle,
};

const orderedCategories: ShopItemCategory[] = [
  'Defense',
  'Melee Weapon',
  'Ranged Weapon',
  'Augment',
  'Utility',
  'Consumable',
  'Relic',
];

const orderedUtilitySubCategories: UtilitySubCategory[] = [
    'Ammunition',
    'Bombs',
    'Traps',
    'Healing',
    'Battery',
    'Miscellaneous',
];

export function ShopUI({ initialInventory }: ShopUIProps) {
  const { toast } = useToast();
  const [playerCrypto, setPlayerCrypto] = useState(2000);
  const [displayInventory, setDisplayInventory] = useState<ShopItem[]>([]);
  // Removed: const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  useEffect(() => {
    setDisplayInventory(initialInventory.map(item => ({
      ...item,
      stock: item.category === 'Consumable' && item.stock === undefined
             ? (typeof item.charges === 'number' ? item.charges : 1)
             : item.stock,
    })));
  }, [initialInventory]);
  
  const [activeCategory, setActiveCategory] = useState<ShopItemCategory>(orderedCategories[0]);

  const handleBuyItem = (itemToBuy: ShopItem) => {
    if (playerCrypto < itemToBuy.cost) {
      toast({
        title: "Insufficient Crypto",
        description: `You need ${itemToBuy.cost} Crypto for ${itemToBuy.name}, but you only have ${playerCrypto}.`,
        variant: "destructive",
      });
      return;
    }

    const currentItemState = displayInventory.find(item => item.id === itemToBuy.id);

    if (currentItemState?.stock !== undefined && currentItemState.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${itemToBuy.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    setPlayerCrypto(prevCrypto => prevCrypto - itemToBuy.cost);
    
    if (currentItemState?.stock !== undefined) {
      setDisplayInventory(prevInv => 
        prevInv.map(item => 
          item.id === itemToBuy.id ? { ...item, stock: Math.max(0, (item.stock || 0) - 1) } : item
        )
      );
    }

    toast({
      title: "Purchase Successful!",
      description: `You bought ${itemToBuy.name} for ${itemToBuy.cost} Crypto.`,
    });
  };

  // Removed handleGenerateImage function

  const renderItemsGrid = (itemsToRender: ShopItem[]) => {
    if (itemsToRender.length === 0) {
        return <p className="text-muted-foreground text-center py-10 col-span-full">No items in this category currently.</p>;
    }
    const displayableItems = itemsToRender.filter(item => !item.id.startsWith('error-') && !item.id.startsWith('warning-'));
    
    if (displayableItems.length === 0 && itemsToRender.length > 0) {
        return (
           <Alert variant="destructive" className="col-span-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Error</AlertTitle>
            <AlertDescription>
              There was an issue loading items for this category. Please check the data source.
            </AlertDescription>
          </Alert>
        );
    }
    if (displayableItems.length === 0) {
        return <p className="text-muted-foreground text-center py-10 col-span-full">No items in this category currently.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {displayableItems.map((item) => {
          const IconForCategory = categoryIcons[item.category];
          const IconForSubCategory = item.subCategory ? utilitySubCategoryIcons[item.subCategory] : null;
          // Removed: const isGeneratingThisImage = generatingImageId === item.id;

          return (
            <Card key={item.id} className="flex flex-col bg-card/80 hover:shadow-primary/30 transition-shadow">
              <CardHeader className="p-3">
                <div className="relative w-full h-32 md:h-36 mb-2 rounded overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'contain' }}
                      data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                    />
                  ) : (
                    <Image
                      src={`https://placehold.co/200x200.png?text=${encodeURIComponent(item.name.substring(0,10))}`}
                      alt={item.name + " placeholder"}
                      fill
                      style={{ objectFit: 'contain' }}
                      data-ai-hint={item.dataAiHint || "item placeholder"}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md leading-tight">{item.name}</CardTitle>
                  {IconForCategory && !IconForSubCategory && <IconForCategory className="h-5 w-5 text-muted-foreground" />}
                  {IconForSubCategory && <IconForSubCategory className="h-5 w-5 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-3 pt-0 space-y-1 text-xs">
                <p className="text-muted-foreground text-pretty">{item.description}</p>
                {item.weaponClass && <p><span className="font-semibold">Class:</span> {item.weaponClass}</p>}
                {item.attack && <p><span className="font-semibold">Attack:</span> {item.attack}</p>}
                {item.actionType && <p><span className="font-semibold">Type:</span> {item.actionType}</p>}
                {typeof item.charges === 'number' && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                {typeof item.charges === 'string' && item.charges === 'Battery' && <p><span className="font-semibold">Charges:</span> <BatteryCharging className="inline-block h-3 w-3 mr-1"/>Battery</p>}
                {item.skillCheck && <p><span className="font-semibold">Skill Check:</span> {item.skillCheck}</p>}
              </CardContent>
              <CardFooter className="p-3 flex flex-col items-start space-y-2 border-t mt-auto">
                {/* Removed AI Image Generation Button */}
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
    );
  };
  
  const systemErrorItem = displayInventory.find(item => item.id.startsWith('error-shop-'));
  const systemWarningItem = displayInventory.find(item => item.id.startsWith('warning-shop-'));

  return (
    <div className="max-w-6xl mx-auto"> 
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

          {systemErrorItem && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{systemErrorItem.name}</AlertTitle>
              <AlertDescription>{systemErrorItem.description}</AlertDescription>
            </Alert>
          )}
           {systemWarningItem && !systemErrorItem && (
            <Alert variant="default" className="mb-4 border-yellow-500 text-yellow-700 [&>svg]:text-yellow-500">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{systemWarningItem.name}</AlertTitle>
              <AlertDescription>{systemWarningItem.description}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ShopItemCategory)} className="w-full">
            <ScrollArea className="pb-2"> 
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap justify-start gap-1">
                {orderedCategories.map(category => {
                  const CategoryIcon = categoryIcons[category];
                  return (
                    <TabsTrigger key={category} value={category} className="flex items-center gap-2 whitespace-normal text-center justify-center md:whitespace-nowrap">
                      <CategoryIcon className="h-4 w-4 hidden sm:inline-block" />
                      <span>{category}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollArea>
            
            {orderedCategories.map(category => (
              <TabsContent key={category} value={category} className="mt-4">
                <ScrollArea className="h-[calc(100vh-28rem)] md:h-[calc(100vh-32rem)] pr-3">
                  {category === 'Utility' ? (
                    orderedUtilitySubCategories.map(subCategory => {
                      const itemsForSubCategory = displayInventory.filter(item => item.category === 'Utility' && item.subCategory === subCategory);
                      if (itemsForSubCategory.length === 0) return null;
                      const SubCategoryIcon = utilitySubCategoryIcons[subCategory];
                      return (
                        <div key={subCategory} className="mb-8">
                          <div className="flex items-center mb-3 text-xl font-medium text-muted-foreground">
                            {SubCategoryIcon && <SubCategoryIcon className="h-5 w-5 mr-2" />}
                            <h3>{subCategory}</h3>
                          </div>
                          {renderItemsGrid(itemsForSubCategory)}
                          <Separator className="my-6 md:my-8" />
                        </div>
                      );
                    })
                  ) : (
                    renderItemsGrid(displayInventory.filter(item => item.category === category))
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

