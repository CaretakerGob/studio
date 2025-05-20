
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Layers } from 'lucide-react';
import { GameCardDisplay } from './game-card-display';
import type { GameCard } from './card-generator-ui';

interface MainGeneratedCardProps {
  latestCard: GameCard | null;
  isLoading: boolean;
  cardKey: number;
}

export function MainGeneratedCard({ latestCard, isLoading, cardKey }: MainGeneratedCardProps) {
  return (
    <>
      {isLoading && !latestCard ? (
        <GameCardDisplay card={null} isLoading={true} size="large" />
      ) : latestCard ? (
        <GameCardDisplay card={latestCard} cardKey={cardKey} size="large" className="animate-in fade-in-50 zoom-in-90 duration-500" />
      ) : (
        <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50 mt-10">
          <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <AlertTitle>No Card Drawn Yet</AlertTitle>
          <AlertDescription>
            Select a deck and click "Draw Random Card", or play a card from your hand.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
