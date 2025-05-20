
"use client";

import type { EventsSheetData } from "./events-sheet-ui";
import { EventCardDisplay } from './event-card-display';

interface EventHistoryDisplayProps {
  previousEvents: EventsSheetData[];
  eventBackgroundImages: Record<string, string>;
}

export function EventHistoryDisplay({ previousEvents, eventBackgroundImages }: EventHistoryDisplayProps) {
  if (previousEvents.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-4">
      <h4 className="text-lg font-semibold mb-3 text-center text-muted-foreground">Previously Drawn Events</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previousEvents.map((event, index) => {
          const historicEventBgImage = eventBackgroundImages[event.Color];
          return (
            <EventCardDisplay
              key={`${event.Color}-${event.Type}-${index}-hist`}
              event={event}
              backgroundImageUrl={historicEventBgImage}
              size="small"
            />
          );
        })}
      </div>
    </div>
  );
}
