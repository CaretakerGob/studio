
"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, RotateCcw } from 'lucide-react';
import type { GameCard } from './card-generator-ui';

interface DeckSelectionControlsProps {
  sampleDecks: { name: string; cards: GameCard[] }[];
  selectedDeck: string | undefined;
  onDeckChange: (deckName: string | undefined) => void;
  onGenerateCard: () => void;
  onResetGenerator: () => void;
  isLoading: boolean;
  isGenerateDisabled: boolean;
}

export function DeckSelectionControls({
  sampleDecks,
  selectedDeck,
  onDeckChange,
  onGenerateCard,
  onResetGenerator,
  isLoading,
  isGenerateDisabled,
}: DeckSelectionControlsProps) {
  return (
    <>
      <div className="space-y-3">
        <Label htmlFor="deck-select">Select a Deck:</Label>
        <Select value={selectedDeck} onValueChange={onDeckChange}>
          <SelectTrigger id="deck-select" className="w-full">
            <SelectValue placeholder="Choose a deck..." />
          </SelectTrigger>
          <SelectContent>
            {sampleDecks.map(deck => (
              <SelectItem key={deck.name} value={deck.name}>
                {deck.name} ({deck.cards.length} cards)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 pt-4">
        <Button 
          onClick={onGenerateCard} 
          size="lg" 
          className="w-full bg-primary hover:bg-primary/90" 
          disabled={isGenerateDisabled || isLoading}
        >
          <Shuffle className="mr-2 h-5 w-5" /> {isLoading ? "Drawing..." : "Draw Random Card"}
        </Button>
        <Button variant="outline" onClick={onResetGenerator} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </>
  );
}
