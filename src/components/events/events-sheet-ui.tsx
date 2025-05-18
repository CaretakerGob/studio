
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { List, Shuffle, AlertCircle, RotateCcw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export interface EventsSheetData {
  Insert?: string;
  Count?: string;
  Color: string;
  Type: string;
  Description: string;
}

interface EventsSheetUIProps {
  items: EventsSheetData[];
  title: string;
  cardDescription: string;
}

const eventBackgroundImages: Record<string, string> = {
  "Black Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FBlack%20Chaos%20BG.png?alt=media&token=bdde52e0-a4ed-4ca7-829a-15e76738d1f7",
  "Blue Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FBlue%20Chaos%20BG.png?alt=media&token=3dc71f42-2bc3-4346-ae47-06c40f3d0c7d",
  "Gray Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FGray%20Chaos%20BG.png?alt=media&token=711fbd2f-460e-4544-a817-90ce4bd44777",
  "Green Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FGreen%20Chaos%20BG.png?alt=media&token=1715a5cf-d6e0-4c2e-9312-4692cc151cb2",
  "Red Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FRed%20Chaos%20BG.png?alt=media&token=0a3782a4-deeb-4239-b58e-2ad618471154",
  "White Chaos": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FChaos%2FWhite%20Chaos%20BG.png?alt=media&token=e561d02f-7cf9-4b74-8c1f-ecd06954dff0",
  "Black Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FBlack%20Order%20BG.png?alt=media&token=28fac667-df9e-43a4-b2c6-8c149b1c5dc1",
  "Blue Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FBlue%20Order%20BG.png?alt=media&token=b69450cc-8fb2-48e0-86a4-497022f1b8ff",
  "Gray Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FGray%20Order%20BG.png?alt=media&token=d05e8dec-7b7a-4947-bd45-8f89c5512b45",
  "Green Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FGreen%20Order%20BG.png?alt=media&token=eb9c8de0-6433-4b7f-b388-78e49db563a8",
  "Red Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FRed%20Order%20BG.png?alt=media&token=cbf43571-69b6-489e-b157-225ea477928c",
  "White Order": "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Events%2FOrder%2FWhite%20order%20BG.png?alt=media&token=14a87a73-3d27-459d-bcb8-b73287ae6368",
};

export function EventsSheetUI({ items, title, cardDescription }: EventsSheetUIProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [drawnEventsHistory, setDrawnEventsHistory] = useState<EventsSheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventKey, setEventKey] = useState(0); 

  const { toast } = useToast();

  const latestEvent = drawnEventsHistory.length > 0 ? drawnEventsHistory[0] : null;
  const previousEvents = drawnEventsHistory.slice(1);

  useEffect(() => {
    if (items && items.length > 0) {
      const uniqueColors = Array.from(new Set(items.map(item => item.Color).filter(Boolean) as string[]));
      setAvailableColors(uniqueColors.sort());
    } else {
      setAvailableColors([]);
    }
  }, [items]);

  const handleColorChange = (value: string) => {
    setSelectedColor(value === "all" ? undefined : value);
  };

  const handleGenerateRandomEvent = () => {
    if (!selectedColor) {
      toast({
        title: "No Color Selected",
        description: "Please select a color to generate an event from.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const filteredItems = items.filter(item => item.Color === selectedColor);

    setTimeout(() => {
      if (filteredItems.length === 0) {
        toast({
          title: "No Events Found",
          description: `No events found for the color "${selectedColor}".`,
          variant: "destructive",
        });
      } else {
        const randomIndex = Math.floor(Math.random() * filteredItems.length);
        const newEvent = filteredItems[randomIndex];
        setDrawnEventsHistory(prevHistory => [newEvent, ...prevHistory].slice(0, 3));
        setEventKey(prev => prev + 1); 
        toast({
          title: "Event Generated!",
          description: `A random event for "${selectedColor}" has been drawn.`,
        });
      }
      setIsLoading(false);
    }, 500); 
  };

  const resetEventsHistory = () => {
    setSelectedColor(undefined);
    setDrawnEventsHistory([]);
    setIsLoading(false);
    toast({ title: "Events Reset", description: "Color selection and event history cleared." });
  };
  
  const systemError = items.length === 1 && items[0].Type === 'System' && items[0].Color === 'Error';
  const currentEventBgImage = latestEvent ? eventBackgroundImages[latestEvent.Color] : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Shuffle className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Event Controls</CardTitle>
          </div>
          <CardDescription>Select a color and generate an event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="color-select" className="text-lg font-medium">Filter by Color:</Label>
            <Select value={selectedColor || ""} onValueChange={handleColorChange} disabled={systemError || items.length === 0}>
              <SelectTrigger id="color-select" className="w-full mt-1">
                <SelectValue placeholder="Select a Color..." />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map(color => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleGenerateRandomEvent} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!selectedColor || isLoading || systemError || items.length === 0}
          >
            <Shuffle className="mr-2 h-5 w-5" />
            {isLoading ? "Generating..." : "Generate Random Event"}
          </Button>
           <Button variant="outline" onClick={resetEventsHistory} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Events
          </Button>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card className="shadow-xl min-h-[300px] flex flex-col justify-start items-center">
          <CardHeader className="w-full text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center w-full p-4">
            {systemError ? (
              <Alert variant="destructive" className="max-w-lg text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <AlertTitle>System Error</AlertTitle>
                  <AlertDescription>
                    {items[0].Description}
                  </AlertDescription>
                </Alert>
            ) : isLoading && !latestEvent ? (
              <div className="space-y-3 w-full max-w-md aspect-[5/7] flex flex-col justify-center items-center">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : latestEvent ? (
              <Card 
                key={eventKey} 
                className="w-full max-w-lg bg-transparent border-primary shadow-lg animate-in fade-in-50 zoom-in-90 duration-500 relative overflow-hidden aspect-[5/7]"
              >
                {currentEventBgImage && (
                  <Image
                    src={currentEventBgImage}
                    alt={`${latestEvent.Color} event background`}
                    fill
                    style={{ objectFit: 'contain' }} 
                    className="absolute inset-0 z-0 opacity-90 pointer-events-none"
                    data-ai-hint="event background texture"
                    priority
                  />
                )}
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4 sm:p-6">
                  <div className="bg-card/80 p-4 sm:p-6 rounded-lg shadow-md text-center max-w-full overflow-y-auto max-h-[90%]">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-xl text-primary">{latestEvent.Type || 'Event'}</CardTitle>
                      <CardDescription className="text-sm">
                        Color: {latestEvent.Color}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">{latestEvent.Description}</p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ) : (
              <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
                <List className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <AlertTitle>No Event Generated</AlertTitle>
                <AlertDescription>
                  {items.length === 0 ? "No event data loaded." : "Select a color and click 'Generate Random Event' to see an event."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {previousEvents.length > 0 && (
          <div className="w-full mt-4">
            <h4 className="text-lg font-semibold mb-3 text-center text-muted-foreground">Previously Drawn Events</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previousEvents.map((event, index) => {
                const historicEventBgImage = eventBackgroundImages[event.Color];
                return (
                  <Card key={`${event.Color}-${event.Type}-${index}`} className="bg-card/60 border-muted-foreground/30 shadow-sm overflow-hidden relative aspect-[5/7]">
                    {historicEventBgImage && (
                       <Image
                        src={historicEventBgImage}
                        alt={`${event.Color} event background`}
                        fill
                        style={{ objectFit: 'contain' }}
                        className="absolute inset-0 z-0 opacity-70 pointer-events-none"
                        data-ai-hint="event background texture small"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-2">
                        <div className="bg-card/70 p-2 rounded-md shadow-sm text-center max-w-full overflow-y-auto max-h-[90%]">
                            <CardHeader className="p-1 pb-1">
                            <CardTitle className="text-sm text-primary truncate">{event.Type || 'Event'}</CardTitle>
                            <CardDescription className="text-xs">Color: {event.Color}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-1 pt-0">
                            <p className="text-xs text-muted-foreground whitespace-pre-line">{event.Description}</p>
                            </CardContent>
                        </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

