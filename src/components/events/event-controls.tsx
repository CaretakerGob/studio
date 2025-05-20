
"use client";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shuffle, RotateCcw } from "lucide-react";

// Values for special random selections
const RANDOM_ANY_COLOR = "random_any_color";
const RANDOM_CHAOS_EVENT = "random_chaos_event";
const RANDOM_ORDER_EVENT = "random_order_event";

interface EventControlsProps {
  selectedRandomType: string | undefined;
  onRandomTypeChange: (value: string | undefined) => void;
  availableChaosColors: string[];
  selectedChaosColor: string | undefined;
  onChaosColorChange: (value: string | undefined) => void;
  availableOrderColors: string[];
  selectedOrderColor: string | undefined;
  onOrderColorChange: (value: string | undefined) => void;
  onGenerateEvent: () => void;
  onResetEvents: () => void;
  isGenerateDisabled: boolean;
  isLoading: boolean;
  systemError: boolean;
  itemsLength: number;
}

export function EventControls({
  selectedRandomType,
  onRandomTypeChange,
  availableChaosColors,
  selectedChaosColor,
  onChaosColorChange,
  availableOrderColors,
  selectedOrderColor,
  onOrderColorChange,
  onGenerateEvent,
  onResetEvents,
  isGenerateDisabled,
  isLoading,
  systemError,
  itemsLength,
}: EventControlsProps) {
  return (
    <>
      <div>
        <Label htmlFor="random-type-select" className="text-md font-medium">Random Event Type:</Label>
        <Select value={selectedRandomType || ""} onValueChange={onRandomTypeChange} disabled={systemError || itemsLength === 0}>
          <SelectTrigger id="random-type-select" className="w-full mt-1">
            <SelectValue placeholder="Select Random Type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RANDOM_ANY_COLOR}>Random Event (Any Color)</SelectItem>
            <SelectItem value={RANDOM_CHAOS_EVENT}>Random Chaos Event</SelectItem>
            <SelectItem value={RANDOM_ORDER_EVENT}>Random Order Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <Label htmlFor="chaos-color-select" className="text-md font-medium">Chaos Colors:</Label>
        <Select value={selectedChaosColor || ""} onValueChange={onChaosColorChange} disabled={systemError || itemsLength === 0 || availableChaosColors.length === 0}>
          <SelectTrigger id="chaos-color-select" className="w-full mt-1">
            <SelectValue placeholder="Select Chaos Color..." />
          </SelectTrigger>
          <SelectContent>
            {availableChaosColors.map(color => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <Label htmlFor="order-color-select" className="text-md font-medium">Order Colors:</Label>
        <Select value={selectedOrderColor || ""} onValueChange={onOrderColorChange} disabled={systemError || itemsLength === 0 || availableOrderColors.length === 0}>
          <SelectTrigger id="order-color-select" className="w-full mt-1">
            <SelectValue placeholder="Select Order Color..." />
          </SelectTrigger>
          <SelectContent>
            {availableOrderColors.map(color => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Button 
        onClick={onGenerateEvent} 
        className="w-full bg-primary hover:bg-primary/90 mt-4"
        disabled={isGenerateDisabled}
      >
        <Shuffle className="mr-2 h-5 w-5" />
        {isLoading ? "Generating..." : "Generate Random Event"}
      </Button>
      <Button variant="outline" onClick={onResetEvents} className="w-full">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset Events
      </Button>
    </>
  );
}
