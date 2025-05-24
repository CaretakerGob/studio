
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // For longer stat focus input
import { WandSparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ItemGeneratorInput, ItemGeneratorOutput } from '@/ai/flows/item-generator-flow';
import { generateGameItem } from '@/ai/flows/item-generator-flow';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const itemTypes: ItemGeneratorInput['itemType'][] = ["Gear", "Melee Weapon", "Ranged Weapon", "Augment", "Utility", "Consumable"];
const rarities: NonNullable<ItemGeneratorInput['rarity']>[] = ["Common", "Uncommon", "Rare", "Artifact"];

export function ItemGeneratorUI() {
  const [itemType, setItemType] = useState<ItemGeneratorInput['itemType'] | undefined>(undefined);
  const [theme, setTheme] = useState<string>('');
  const [rarity, setRarity] = useState<ItemGeneratorInput['rarity'] | undefined>(undefined);
  const [statFocus, setStatFocus] = useState<string>('');
  const [generatedItem, setGeneratedItem] = useState<ItemGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!itemType) {
      toast({
        title: "Item Type Required",
        description: "Please select an item category to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedItem(null);

    try {
      const input: ItemGeneratorInput = { itemType };
      if (theme.trim() !== '') input.theme = theme.trim();
      if (rarity) input.rarity = rarity;
      if (statFocus.trim() !== '') input.statFocus = statFocus.trim();
      
      const result = await generateGameItem(input);
      setGeneratedItem(result);
      toast({
        title: "Item Generated!",
        description: `Successfully generated: ${result.itemName}`,
      });
    } catch (error) {
      console.error("Error generating item:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <WandSparkles className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">AI Item Generator</CardTitle>
          </div>
          <CardDescription>
            Define parameters to generate a unique game item for Riddle of the Beast.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemTypeSelect">Item Category (Required)</Label>
            <Select value={itemType} onValueChange={(value) => setItemType(value as ItemGeneratorInput['itemType'])}>
              <SelectTrigger id="itemTypeSelect" className="w-full">
                <SelectValue placeholder="Select an item category..." />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="themeInput">Theme / Keywords (Optional)</Label>
            <Input
              id="themeInput"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., cursed, ancient, fire, bio-mechanical"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="raritySelect">Rarity (Optional)</Label>
            <Select value={rarity} onValueChange={(value) => setRarity(value as ItemGeneratorInput['rarity'])}>
              <SelectTrigger id="raritySelect" className="w-full">
                <SelectValue placeholder="Select item rarity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as any}>Any (AI Decides)</SelectItem>
                {rarities.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statFocusInput">Specific Stat Focus / Effect (Optional)</Label>
            <Textarea
              id="statFocusInput"
              value={statFocus}
              onChange={(e) => setStatFocus(e.target.value)}
              placeholder="e.g., 'Grants temporary invisibility', 'Boosts defense against spirits', 'High electricity damage with a chance to stun'"
              rows={3}
            />
             <p className="text-xs text-muted-foreground">
              Describe a desired mechanical outcome or stat emphasis.
            </p>
          </div>


          <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || !itemType}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WandSparkles className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Generate Item'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && !generatedItem && (
        <Card className="shadow-md animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mt-1"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-full mt-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardContent>
        </Card>
      )}

      {generatedItem && (
        <Card className="shadow-xl animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="text-xl text-primary">{generatedItem.itemName}</CardTitle>
            <div className="flex justify-between items-center text-sm">
              <CardDescription>Category: {generatedItem.itemTypeGenerated}</CardDescription>
              {generatedItem.rarityGenerated && (
                <Badge variant={
                  generatedItem.rarityGenerated === "Artifact" ? "destructive" :
                  generatedItem.rarityGenerated === "Rare" ? "default" : // Primary color
                  generatedItem.rarityGenerated === "Uncommon" ? "secondary" :
                  "outline" // Common
                }>
                  {generatedItem.rarityGenerated}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-muted-foreground">Lore Description:</h4>
              <p className="whitespace-pre-line">{generatedItem.description}</p>
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground">Game Effect:</h4>
              <p className="whitespace-pre-line">{generatedItem.gameEffect}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
