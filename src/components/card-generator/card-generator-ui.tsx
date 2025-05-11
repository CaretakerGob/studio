"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Shuffle, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

interface GameCard {
  id: string;
  name: string;
  type: string; // e.g., 'Event', 'Item', 'Curse'
  deck: string;
  description: string;
  imageUrl?: string; // Placeholder
  dataAiHint: string;
}

const sampleDecks: { name: string; cards: GameCard[] }[] = [
  {
    name: "Event Deck",
    cards: [
      { id: "ev1", name: "Sudden Gloom", type: "Event", deck: "Event Deck", description: "Darkness falls. All heroes suffer -1 Sanity.", imageUrl: "https://picsum.photos/300/450?random=1", dataAiHint: "dark event" },
      { id: "ev2", name: "Whispers in the Dark", type: "Event", deck: "Event Deck", description: "Make a Sanity check ( difficulté 3) or lose your next turn.", imageUrl: "https://picsum.photos/300/450?random=2", dataAiHint: "eerie whisper" },
      { id: "ev3", name: "A Moment of Respite", type: "Event", deck: "Event Deck", description: "A brief calm. All heroes recover 1 HP.", imageUrl: "https://picsum.photos/300/450?random=3", dataAiHint: "calm scene" },
    ],
  },
  {
    name: "Item Deck",
    cards: [
      { id: "it1", name: "Ancient Lantern", type: "Item", deck: "Item Deck", description: "Grants +1 to exploration rolls in dark areas.", imageUrl: "https://picsum.photos/300/450?random=4", dataAiHint: "old lantern" },
      { id: "it2", name: "Blessed Charm", type: "Item", deck: "Item Deck", description: "Once per game, reroll a failed Sanity check.", imageUrl: "https://picsum.photos/300/450?random=5", dataAiHint: "holy charm" },
      { id: "it3", name: "Rusty Shiv", type: "Item", deck: "Item Deck", description: "+1 ATK for one combat. Discard after use.", imageUrl: "https://picsum.photos/300/450?random=6", dataAiHint: "rusty knife" },
    ],
  },
  {
    name: "Curse Deck",
    cards: [
      { id: "cu1", name: "Curse of Frailty", type: "Curse", deck: "Curse Deck", description: "Your DEF is reduced by 1 until this curse is lifted.", imageUrl: "https://picsum.photos/300/450?random=7", dataAiHint: "weakness curse" },
      { id: "cu2", name: "Haunting Visions", type: "Curse", deck: "Curse Deck", description: "At the start of your turn, make a Sanity check (difficulté 2) or skip your action.", imageUrl: "https://picsum.photos/300/450?random=8", dataAiHint: "scary vision" },
    ],
  },
];

export function CardGeneratorUI() {
  const [selectedDecks, setSelectedDecks] = useState<string[]>(sampleDecks.map(deck => deck.name));
  const [generatedCard, setGeneratedCard] = useState<GameCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardKey, setCardKey] = useState(0); // For re-triggering animation

  const handleDeckSelection = (deckName: string) => {
    setSelectedDecks(prev =>
      prev.includes(deckName) ? prev.filter(name => name !== deckName) : [...prev, deckName]
    );
  };

  const generateCard = () => {
    setIsLoading(true);
    setGeneratedCard(null); // Clear previous card for loading state

    const availableCards = sampleDecks
      .filter(deck => selectedDecks.includes(deck.name))
      .flatMap(deck => deck.cards);

    if (availableCards.length === 0) {
      alert("Please select at least one deck to draw from.");
      setIsLoading(false);
      return;
    }
    
    // Simulate API call or heavy processing
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      setGeneratedCard(availableCards[randomIndex]);
      setCardKey(prev => prev + 1); // Change key to re-mount/re-animate card
      setIsLoading(false);
    }, 500); // Simulate delay
  };

  const resetGenerator = () => {
    setSelectedDecks(sampleDecks.map(deck => deck.name));
    setGeneratedCard(null);
    setIsLoading(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
             <Layers className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Card Decks</CardTitle>
          </div>
          <CardDescription>Select which decks to include in the draw pile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sampleDecks.map(deck => (
            <div key={deck.name} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Checkbox
                id={deck.name}
                checked={selectedDecks.includes(deck.name)}
                onCheckedChange={() => handleDeckSelection(deck.name)}
              />
              <Label htmlFor={deck.name} className="text-base cursor-pointer flex-grow">
                {deck.name} <span className="text-xs text-muted-foreground">({deck.cards.length} cards)</span>
              </Label>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button onClick={generateCard} size="lg" className="w-full bg-primary hover:bg-primary/90" disabled={selectedDecks.length === 0 || isLoading}>
            <Shuffle className="mr-2 h-5 w-5" /> {isLoading ? "Drawing..." : "Draw Random Card"}
          </Button>
           <Button variant="outline" onClick={resetGenerator} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2 shadow-xl min-h-[400px] flex flex-col justify-center items-center">
        <CardHeader className="w-full text-center">
           <CardTitle className="text-2xl">Generated Card</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center w-full p-4">
          {isLoading ? (
            <div className="space-y-4 w-full max-w-xs">
              <Skeleton className="h-[250px] w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          ) : generatedCard ? (
            <Card key={cardKey} className="w-full max-w-sm bg-card/80 border-primary shadow-lg animate-in fade-in-50 zoom-in-90 duration-500">
              {generatedCard.imageUrl && (
                <div className="relative w-full h-60 overflow-hidden rounded-t-lg">
                  <Image
                    src={generatedCard.imageUrl}
                    alt={generatedCard.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={generatedCard.dataAiHint}
                  />
                </div>
              )}
              <CardHeader className="pt-4">
                <CardTitle className="text-xl text-primary">{generatedCard.name}</CardTitle>
                <CardDescription className="text-sm">Type: {generatedCard.type} (From: {generatedCard.deck})</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{generatedCard.description}</p>
              </CardContent>
            </Card>
          ) : (
            <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
              <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <AlertTitle>No Card Drawn Yet</AlertTitle>
              <AlertDescription>
                Select your decks and click "Draw Random Card" to reveal your fate.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
