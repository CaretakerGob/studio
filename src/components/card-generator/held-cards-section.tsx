
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hand } from 'lucide-react';
import { GameCardDisplay } from './game-card-display';
import type { GameCard } from './card-generator-ui';

interface HeldCardsSectionProps {
  heldCards: GameCard[];
  onPlayHeldCard: (cardToPlay: GameCard) => void;
}

export function HeldCardsSection({ heldCards, onPlayHeldCard }: HeldCardsSectionProps) {
  return (
    <>
      {heldCards.length === 0 ? (
        <Alert variant="default" className="text-center border-dashed border-muted-foreground/50">
          <Hand className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
          <AlertTitle className="text-sm">No Cards Held</AlertTitle>
          <AlertDescription className="text-xs">
            Cards marked as "holdable" will appear here when drawn.
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[250px] pr-3">
          <div className="space-y-3">
            {heldCards.map((card, index) => (
              <GameCardDisplay
                key={`${card.id}-held-${index}`}
                card={card}
                size="medium" // Or "small" depending on desired size
                onClick={() => onPlayHeldCard(card)}
                isButton={true}
                buttonText="Click to Play"
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}
