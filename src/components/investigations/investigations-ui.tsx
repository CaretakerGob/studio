
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClipboardList, AlertCircle, Dices, RotateCcw } from "lucide-react";
import type { InvestigationData } from "@/types/investigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

  const systemError = investigations.length === 1 && investigations[0]['Location Color'] === 'Error' && investigations[0].NPC === 'System';

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
    }, 300); // Simulate a short delay
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
          <div>
            <Label htmlFor="location-color-select" className="text-md font-medium">Location Color:</Label>
            <Select value={selectedColor} onValueChange={handleColorSelect} disabled={systemError || availableColors.length === 0}>
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
            onClick={handleRollDice} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!selectedColor || isLoading || systemError}
          >
            <Dices className="mr-2 h-5 w-5" />
            {isLoading ? "Rolling..." : `Roll 1d6 for ${selectedColor || 'Location'}`}
          </Button>
          <Button variant="outline" onClick={resetGenerator} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-xl min-h-[300px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Encounter Details</CardTitle>
          {diceRollResult && selectedColor && (
            <CardDescription>
              Rolled a <span className="font-bold text-primary">{diceRollResult}</span> for <span className="font-bold text-primary">{selectedColor}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
          {systemError ? (
            <Alert variant="destructive" className="max-w-lg text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <AlertTitle>System Error</AlertTitle>
              <AlertDescription>
                {investigations[0].Description || "Could not load Investigation data. Please check logs."}
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : currentEncounter ? (
            <div className="w-full max-w-lg bg-card/80 p-6 rounded-lg shadow-md border border-primary space-y-3">
              <h3 className="text-xl font-semibold text-primary">NPC: {currentEncounter.NPC}</h3>
              <p><strong className="text-muted-foreground">Unit:</strong> {currentEncounter.Unit}</p>
              <p><strong className="text-muted-foreground">Persona:</strong> {currentEncounter.Persona}</p>
              <p><strong className="text-muted-foreground">Demand:</strong> {currentEncounter.Demand}</p>
              <p><strong className="text-muted-foreground">Skill Check:</strong> {currentEncounter['Skill Check']}</p>
              <p><strong className="text-muted-foreground">Goals:</strong> {currentEncounter.Goals}</p>
              <p><strong className="text-muted-foreground">Passive:</strong> {currentEncounter.Passive}</p>
              {currentEncounter.Description && currentEncounter.Description.trim() !== '' && (
                 <p className="whitespace-pre-line"><strong className="text-muted-foreground">Description:</strong> {currentEncounter.Description}</p>
              )}
            </div>
          ) : (
            <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <AlertTitle>No Encounter Generated</AlertTitle>
              <AlertDescription>
                {availableColors.length === 0 && !systemError ? "No investigation data loaded to generate encounters from." : "Select a location color and roll the dice to see encounter details."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
