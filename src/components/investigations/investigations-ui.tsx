
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices } from "lucide-react";
import type { InvestigationData } from "@/types/investigation";
import { useToast } from '@/hooks/use-toast';
import { InvestigationControls } from './investigation-controls';
import { InvestigationDisplay } from './investigation-display';

interface InvestigationsUIProps {
  investigations: InvestigationData[];
}

export function InvestigationsUI({ investigations }: InvestigationsUIProps) {
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
  const [currentEncounter, setCurrentEncounter] = useState<InvestigationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const systemErrorItem = investigations.find(inv => inv['Location Color'] === 'Error' && inv.NPC === 'System');
  const systemError = !!systemErrorItem;
  const systemErrorMessage = systemErrorItem?.Description?.toString();

  useEffect(() => {
    if (investigations && investigations.length > 0 && !systemError) {
      const uniqueColors = Array.from(new Set(investigations.map(inv => inv['Location Color']).filter(Boolean) as string[]));
      setAvailableColors(uniqueColors.sort());
    } else {
      setAvailableColors([]);
    }
  }, [investigations, systemError]);

  const handleColorSelect = (color: string | undefined) => {
    setSelectedColor(color);
    setDiceRollResult(null);
    setCurrentEncounter(null);
  };

  const handleRollDice = () => {
    if (!selectedColor) {
      toast({
        title: "No Location Selected",
        description: "Please select a Location Color before rolling.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRollResult(roll);

      const foundEncounter = investigations.find(
        inv => inv['Location Color'] === selectedColor && parseInt(inv['1d6 Roll'] as string, 10) === roll
      );

      if (foundEncounter) {
        setCurrentEncounter(foundEncounter);
        toast({
          title: "Encounter Found!",
          description: `Rolled a ${roll} for ${selectedColor}.`,
        });
      } else {
        setCurrentEncounter(null);
        toast({
          title: "No Encounter Found",
          description: `No encounter details found for ${selectedColor} with a roll of ${roll}.`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 300); 
  };
  
  const resetGenerator = () => {
    setSelectedColor(undefined);
    setDiceRollResult(null);
    setCurrentEncounter(null);
    setIsLoading(false);
    toast({ title: "Generator Reset", description: "Location color and encounter details cleared." });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Dices className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Investigation Controls</CardTitle>
          </div>
          <CardDescription>Select a location color and roll for an encounter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InvestigationControls
            availableColors={availableColors}
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
            onRollDice={handleRollDice}
            onResetGenerator={resetGenerator}
            isLoading={isLoading}
            systemError={systemError}
          />
        </CardContent>
      </Card>

      <InvestigationDisplay
        currentEncounter={currentEncounter}
        isLoading={isLoading}
        diceRollResult={diceRollResult}
        selectedColor={selectedColor}
        systemError={systemError}
        systemErrorMessage={systemErrorMessage}
        availableColors={availableColors}
      />
    </div>
  );
}
