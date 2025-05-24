
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WandSparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ItemGeneratorInput, ItemGeneratorOutput } from '@/ai/flows/item-generator-flow';
import { generateGameItem } from '@/ai/flows/item-generator-flow'; // Import the flow directly

const itemTypes: ItemGeneratorInput['itemType'][] = ["weapon", "armor", "trinket", "potion", "scroll"];

export function ItemGeneratorUI() {
  const [itemType, setItemType] = useState<ItemGeneratorInput['itemType'] | undefined>(undefined);
  const [theme, setTheme] = useState<string>('');
  const [generatedItem, setGeneratedItem] = useState<ItemGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!itemType) {
      toast({
        title: "Item Type Required",
        description: "Please select an item type to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedItem(null);

    try {
      const input: ItemGeneratorInput = { itemType };
      if (theme.trim() !== '') {
        input.theme = theme.trim();
      }
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
            Select an item type and optionally provide a theme to generate a unique game item using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemTypeSelect">Item Type (Required)</Label>
            <Select value={itemType} onValueChange={(value) => setItemType(value as ItemGeneratorInput['itemType'])}>
              <SelectTrigger id="itemTypeSelect" className="w-full">
                <SelectValue placeholder="Select an item type..." />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
              placeholder="e.g., cursed, ancient, fire, holy relic"
            />
            <p className="text-xs text-muted-foreground">
              Provide a theme, material, or concept like "shadowy dagger", "elven cloak", "potion of giant strength".
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
            <CardDescription>Type: {generatedItem.itemTypeGenerated}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-muted-foreground">Description:</h4>
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
