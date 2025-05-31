
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users } from "lucide-react"; // Changed icon to Users
import type { InvestigationData } from "@/types/investigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

interface InvestigationDisplayProps {
  currentEncounter: InvestigationData | null;
  isLoading: boolean;
  diceRollResult: number | null;
  selectedColor: string | undefined;
  systemError: boolean;
  systemErrorMessage?: string;
  availableColors: string[];
}

export function InvestigationDisplay({
  currentEncounter,
  isLoading,
  diceRollResult,
  selectedColor,
  systemError,
  systemErrorMessage,
  availableColors,
}: InvestigationDisplayProps) {
  return (
    <Card className="md:col-span-2 shadow-xl min-h-[300px] flex flex-col">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Generated NPC Details</CardTitle>
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
              {systemErrorMessage || "Could not load NPC data. Please check logs."}
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
            {currentEncounter.Description && currentEncounter.Description.toString().trim() !== '' && (
              <p className="whitespace-pre-line"><strong className="text-muted-foreground">Description:</strong> {currentEncounter.Description.toString()}</p>
            )}
          </div>
        ) : (
          <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <AlertTitle>No NPC Generated</AlertTitle>
            <AlertDescription>
              {availableColors.length === 0 && !systemError ? "No NPC data loaded to generate NPCs from." : "Select a location color and roll the dice to see NPC details."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
