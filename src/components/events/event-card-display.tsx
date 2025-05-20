
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventsSheetData } from "./events-sheet-ui"; // Adjust path if EventsSheetData moves
import { cn } from '@/lib/utils';

interface EventCardDisplayProps {
  event: EventsSheetData | null;
  backgroundImageUrl?: string;
  isLoading?: boolean;
  eventKey?: number | string; // For re-triggering animations if needed
  size?: 'large' | 'small';
  className?: string;
}

export function EventCardDisplay({
  event,
  backgroundImageUrl,
  isLoading = false,
  eventKey,
  size = 'large',
  className,
}: EventCardDisplayProps) {

  if (isLoading && size === 'large') {
    return (
      <div className={cn("space-y-3 w-full max-w-md aspect-[5/7] flex flex-col justify-center items-center", className)}>
        <Card className="w-full max-w-lg bg-transparent border-primary shadow-lg aspect-[5/7] flex flex-col justify-center items-center">
            <div className="w-3/4 space-y-2">
                <div className="h-8 w-3/4 bg-muted rounded animate-pulse self-center mx-auto"></div>
                <div className="h-6 w-1/2 bg-muted rounded animate-pulse self-center mx-auto"></div>
                <div className="h-20 w-full bg-muted rounded animate-pulse"></div>
            </div>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null; 
  }
  
  const cardBaseClass = "bg-transparent border-primary shadow-lg relative overflow-hidden aspect-[5/7]";
  const cardSizeClass = 
    size === 'large' ? "w-full max-w-lg" :
    "w-full"; // Small cards will take full width of their grid cell

  const textContainerSizeClass = 
    size === 'large' ? "p-4 sm:p-6" : "p-2";
  
  const titleSizeClass = 
    size === 'large' ? "text-xl text-primary" : "text-sm text-primary truncate";
  
  const descriptionSizeClass = 
    size === 'large' ? "text-sm" : "text-xs";
  
  const contentTextSizeClass = 
    size === 'large' ? "text-sm sm:text-base text-muted-foreground whitespace-pre-line" : "text-xs text-muted-foreground whitespace-pre-line";


  return (
    <Card 
      key={eventKey} 
      className={cn(
        cardBaseClass,
        cardSizeClass,
        size === 'small' && "bg-card/60 border-muted-foreground/30 shadow-sm",
        className
      )}
    >
      {backgroundImageUrl && (
        <Image
          src={backgroundImageUrl}
          alt={`${event.Color} event background`}
          fill
          style={{ objectFit: 'contain' }} 
          className="absolute inset-0 z-0 opacity-90 pointer-events-none"
          data-ai-hint="event background texture"
          priority={size === 'large'}
        />
      )}
      <div className={cn("relative z-10 flex flex-col items-center justify-center h-full w-full", size === 'large' ? "p-4 sm:p-6" : "p-1")}>
        <div className={cn("bg-card/80 rounded-lg shadow-md text-center max-w-full overflow-y-auto max-h-[90%]", textContainerSizeClass)}>
          <CardHeader className={cn("p-0", size === 'large' ? "pb-2" : "pb-1")}>
            <CardTitle className={titleSizeClass}>{event.Type || 'Event'}</CardTitle>
            <CardDescription className={descriptionSizeClass}>
              Color: {event.Color}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className={contentTextSizeClass}>{event.Description}</p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
