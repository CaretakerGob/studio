
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shuffle, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

import { EventControls } from './event-controls';
import { MainEventDisplay } from './main-event-display';
import { EventHistoryDisplay } from './event-history-display';


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

// Note: Ensure these images are optimized for web performance (e.g., compressed, appropriate format).
// Large unoptimized images can significantly impact loading time and rendering performance.
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

const RANDOM_ANY_COLOR = "random_any_color";
const RANDOM_CHAOS_EVENT = "random_chaos_event";
const RANDOM_ORDER_EVENT = "random_order_event";

export function EventsSheetUI({ items, title, cardDescription }: EventsSheetUIProps) {
  // State for pre-filtered event data
  // drawableItems excludes system messages (errors/warnings)
  // chaosEvents and orderEvents are pre-filtered for their respective types
  // Pre-filtering helps optimize random event generation by avoiding repeated filtering of the entire list.
  const [drawableItems, setDrawableItems] = useState<EventsSheetData[]>([]);
  const [chaosEvents, setChaosEvents] = useState<EventsSheetData[]>([]);
  const [orderEvents, setOrderEvents] = useState<EventsSheetData[]>([]);
  const [selectedRandomType, setSelectedRandomType] = useState<string | undefined>(undefined);
  const [selectedChaosColor, setSelectedChaosColor] = useState<string | undefined>(undefined);
  const [selectedOrderColor, setSelectedOrderColor] = useState<string | undefined>(undefined);
  
  const [availableChaosColors, setAvailableChaosColors] = useState<string[]>([]);
  const [availableOrderColors, setAvailableOrderColors] = useState<string[]>([]);
  
  const [drawnEventsHistory, setDrawnEventsHistory] = useState<EventsSheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventKey, setEventKey] = useState(0); 

  const { toast } = useToast();

  const latestEvent = drawnEventsHistory.length > 0 ? drawnEventsHistory[0] : null;
  const previousEvents = drawnEventsHistory.slice(1);

  useEffect(() => {
    if (items && items.length > 0) {
      // Pre-filter items to exclude system messages
      const filteredDrawableItems = items.filter(item => !(item.Type === 'System' && (item.Color === 'Error' || item.Color === 'Warning')));
      setDrawableItems(filteredDrawableItems);

      const uniqueColors = Array.from(new Set(items.map(item => item.Color).filter(Boolean) as string[]));
      setAvailableChaosColors(uniqueColors.filter(color => color.includes("Chaos")).sort());
      setAvailableOrderColors(uniqueColors.filter(color => color.includes("Order")).sort());
      
      // Pre-filter items based on type for quicker access during generation
      setChaosEvents(filteredDrawableItems.filter(item => item.Color.includes("Chaos")));
      setOrderEvents(filteredDrawableItems.filter(item => item.Color.includes("Order")));

    } else {
      setAvailableChaosColors([]);
      setAvailableOrderColors([]);
    }
  }, [items]);

  const handleRandomTypeChange = (value: string | undefined) => {
    setSelectedRandomType(value);
    setSelectedChaosColor(undefined);
    setSelectedOrderColor(undefined);
  };

  const handleChaosColorChange = (value: string | undefined) => {
    setSelectedChaosColor(value);
    setSelectedRandomType(undefined);
    setSelectedOrderColor(undefined);
  };

  const handleOrderColorChange = (value: string | undefined) => {
    setSelectedOrderColor(value);
    setSelectedRandomType(undefined);
    setSelectedChaosColor(undefined);
  };

  const handleGenerateRandomEvent = () => {
    const activeSelection = selectedRandomType || selectedChaosColor || selectedOrderColor;

    if (!activeSelection) {
      toast({
        title: "No Selection Made",
        description: "Please select a random type or a specific color to generate an event.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    let filteredItems: EventsSheetData[] = [];
    let toastMessageDescription = "";

    if (selectedRandomType) {
      if (selectedRandomType === RANDOM_ANY_COLOR) {
        filteredItems = drawableItems;
        toastMessageDescription = "A random event from all colors has been drawn.";
      } else if (selectedRandomType === RANDOM_CHAOS_EVENT) {
        filteredItems = chaosEvents;
        toastMessageDescription = "A random Chaos event has been drawn.";
      } else if (selectedRandomType === RANDOM_ORDER_EVENT) {
        filteredItems = orderEvents;
        toastMessageDescription = "A random Order event has been drawn.";
      }
    } else if (selectedChaosColor) {
      filteredItems = drawableItems.filter(item => item.Color === selectedChaosColor); // Still need to filter by specific color
      toastMessageDescription = `A random event for "${selectedChaosColor}" has been drawn.`;
    } else if (selectedOrderColor) {
      filteredItems = drawableItems.filter(item => item.Color === selectedOrderColor);
      toastMessageDescription = `A random event for "${selectedOrderColor}" has been drawn.`;
    }
    
    setTimeout(() => {
      if (filteredItems.length === 0) {
        toast({
          title: "No Events Found",
          description: `No suitable events found for your selection.`,
          variant: "destructive",
        });
      } else {
        const randomIndex = Math.floor(Math.random() * filteredItems.length);
        const newEvent = filteredItems[randomIndex];
        setDrawnEventsHistory(prevHistory => [newEvent, ...prevHistory].slice(0, 3));
        setEventKey(prev => prev + 1); 
        toast({
          title: "Event Generated!",
          description: toastMessageDescription,
        });
      }
      setIsLoading(false);
    }, 500); 
  };

  const resetEventsHistory = () => {
    setSelectedRandomType(undefined);
    setSelectedChaosColor(undefined);
    setSelectedOrderColor(undefined);
    setDrawnEventsHistory([]);
    setIsLoading(false);
    toast({ title: "Events Reset", description: "Selection and event history cleared." });
  };
  
  const systemErrorItem = items.find(item => item.Type === 'System' && item.Color === 'Error');
  const isGenerateButtonDisabled = (!selectedRandomType && !selectedChaosColor && !selectedOrderColor) || isLoading || !!systemErrorItem || drawableItems.length === 0;


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Shuffle className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Event Controls</CardTitle>
          </div>
          <CardDescription>Select a type or color and generate an event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventControls 
            selectedRandomType={selectedRandomType}
            onRandomTypeChange={handleRandomTypeChange}
            availableChaosColors={availableChaosColors}
            selectedChaosColor={selectedChaosColor}
            onChaosColorChange={handleChaosColorChange}
            availableOrderColors={availableOrderColors}
            selectedOrderColor={selectedOrderColor}
            onOrderColorChange={handleOrderColorChange}
            onGenerateEvent={handleGenerateRandomEvent}
            onResetEvents={resetEventsHistory}
            isGenerateDisabled={isGenerateButtonDisabled}
            isLoading={isLoading}
            systemError={!!systemErrorItem}
            itemsLength={items.length}
          />
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card className="shadow-xl min-h-[300px] flex flex-col justify-start items-center">
          <CardHeader className="w-full text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center w-full p-4">
            <MainEventDisplay 
              latestEvent={latestEvent}
              isLoading={isLoading}
              eventKey={eventKey}
              eventBackgroundImages={eventBackgroundImages}
              systemError={!!systemErrorItem}
              systemErrorMessage={systemErrorItem?.Description || "An unknown system error occurred."}
              itemsLength={items.filter(item => !(item.Type === 'System' && (item.Color === 'Error' || item.Color === 'Warning'))).length}
            />
          </CardContent>
        </Card>

        <EventHistoryDisplay previousEvents={previousEvents} eventBackgroundImages={eventBackgroundImages} />
      </div>
    </div>
  );
}
