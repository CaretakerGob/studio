
"use client";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dices, RotateCcw } from "lucide-react";

interface InvestigationControlsProps {
  availableColors: string[];
  selectedColor: string | undefined;
  onColorSelect: (color: string | undefined) => void;
  onRollDice: () => void;
  onResetGenerator: () => void;
  isLoading: boolean;
  systemError: boolean;
}

export function InvestigationControls({
  availableColors,
  selectedColor,
  onColorSelect,
  onRollDice,
  onResetGenerator,
  isLoading,
  systemError,
}: InvestigationControlsProps) {
  return (
    <>
      <div>
        <Label htmlFor="location-color-select" className="text-md font-medium">Location Color:</Label>
        <Select value={selectedColor} onValueChange={onColorSelect} disabled={systemError || availableColors.length === 0}>
          <SelectTrigger id="location-color-select" className="w-full mt-1">
            <SelectValue placeholder="Select Location Color..." />
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
        onClick={onRollDice}
        className="w-full bg-primary hover:bg-primary/90"
        disabled={!selectedColor || isLoading || systemError}
      >
        <Dices className="mr-2 h-5 w-5" />
        {isLoading ? "Rolling..." : `Roll 1d6 for ${selectedColor || 'Location'}`}
      </Button>
      <Button variant="outline" onClick={onResetGenerator} className="w-full">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </>
  );
}
