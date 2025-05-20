
"use client";

import { GameCardDisplay } from './game-card-display';
import type { GameCard } from './card-generator-ui';

interface DrawnHistoryDisplayProps {
  previousCards: GameCard[];
}

export function DrawnHistoryDisplay({ previousCards }: DrawnHistoryDisplayProps) {
  if (previousCards.length === 0) {
    return null;
  }

  return (
    <div className="md:col-start-2 md:col-span-2 w-full mt-8 md:mt-6">
      <h4 className="text-lg font-semibold mb-3 text-center text-muted-foreground">Previously Drawn</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previousCards.map((card, index) => (
          <GameCardDisplay
            key={`${card.id}-hist-${index}`}
            card={card}
            size="small" // Or "medium" depending on desired size
          />
        ))}
      </div>
    </div>
  );
}
