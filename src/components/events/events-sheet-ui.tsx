
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { List, Shuffle, AlertCircle } from "lucide-react";
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

export function EventsSheetUI({ items, title, cardDescription }: EventsSheetUIProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [randomlySelectedEvent, setRandomlySelectedEvent] = useState<EventsSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventKey, setEventKey] = useState(0); // For re-triggering animation

  const { toast } = useToast();

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
    setRandomlySelectedEvent(null); // Clear previous event when color changes
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
    setRandomlySelectedEvent(null); // Clear previous before generating new

    const filteredItems = items.filter(item => item.Color === selectedColor);

    setTimeout(() => {
      if (filteredItems.length === 0) {
        toast({
          title: "No Events Found",
          description: `No events found for the color "${selectedColor}".`,
          variant: "destructive",
        });
        setRandomlySelectedEvent(null);
      } else {
        const randomIndex = Math.floor(Math.random() * filteredItems.length);
        const newEvent = filteredItems[randomIndex];
        setRandomlySelectedEvent(newEvent);
        setEventKey(prev => prev + 1); // Trigger animation
        toast({
          title: "Event Generated!",
          description: `A random event from "${selectedColor}" has been drawn.`,
        });
      }
      setIsLoading(false);
    }, 500); // Simulate loading
  };
  
  const systemError = items.length === 1 && items[0].Type === 'System' && items[0].Color === 'Error';


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {/* Controls Card */}
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
        </CardContent>
      </Card>

      {/* Display Card for Random Event */}
      <Card className="md:col-span-2 shadow-xl min-h-[300px] flex flex-col justify-start items-center">
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
          ) : isLoading ? (
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : randomlySelectedEvent ? (
            <Card key={eventKey} className="w-full max-w-lg bg-card/80 border-primary shadow-lg animate-in fade-in-50 zoom-in-90 duration-500">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{randomlySelectedEvent.Type || 'Event'}</CardTitle>
                <CardDescription className="text-sm">Color: {randomlySelectedEvent.Color} {randomlySelectedEvent.Insert && `(Insert: ${randomlySelectedEvent.Insert})`} {randomlySelectedEvent.Count && `(Count: ${randomlySelectedEvent.Count})`}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{randomlySelectedEvent.Description}</p>
              </CardContent>
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
    </div>
  );
}
