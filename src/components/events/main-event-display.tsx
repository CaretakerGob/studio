
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { List, AlertCircle } from "lucide-react";
import type { EventsSheetData } from "./events-sheet-ui";
import { EventCardDisplay } from './event-card-display';

interface MainEventDisplayProps {
  latestEvent: EventsSheetData | null;
  isLoading: boolean;
  eventKey: number;
  eventBackgroundImages: Record<string, string>;
  systemError: boolean;
  systemErrorMessage?: string;
  itemsLength: number;
}

export function MainEventDisplay({
  latestEvent,
  isLoading,
  eventKey,
  eventBackgroundImages,
  systemError,
  systemErrorMessage,
  itemsLength,
}: MainEventDisplayProps) {
  
  const currentEventBgImage = latestEvent ? eventBackgroundImages[latestEvent.Color] : undefined;

  if (systemError) {
    return (
      <Alert variant="destructive" className="max-w-lg text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <AlertTitle>System Error</AlertTitle>
        <AlertDescription>
          {systemErrorMessage || "Could not load event data. Please check your setup."}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && !latestEvent) {
    return <EventCardDisplay event={null} isLoading={true} size="large" />;
  }

  if (latestEvent) {
    return (
      <EventCardDisplay 
        event={latestEvent} 
        backgroundImageUrl={currentEventBgImage}
        eventKey={eventKey} 
        size="large" 
        className="animate-in fade-in-50 zoom-in-90 duration-500"
      />
    );
  }

  return (
    <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
      <List className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <AlertTitle>No Event Generated</AlertTitle>
      <AlertDescription>
        {itemsLength === 0 ? "No event data loaded." : "Select a type or color and click 'Generate Random Event' to see an event."}
      </AlertDescription>
    </Alert>
  );
}
