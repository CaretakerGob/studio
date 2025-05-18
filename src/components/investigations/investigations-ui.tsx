
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, AlertCircle } from "lucide-react";
import type { InvestigationData } from "@/types/investigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface InvestigationsUIProps {
  investigations: InvestigationData[];
}

export function InvestigationsUI({ investigations }: InvestigationsUIProps) {
  const headers = investigations.length > 0 ? Object.keys(investigations[0]) : [
    "Location Color", "1d6 Roll", "NPC", "Unit", "Persona", "Demand", "Skill Check", "Goals", "Passive"
  ];

  // Helper to format header keys for display (e.g., Location Color -> Location Color)
  const formatHeader = (headerKey: string) => {
    // Keeps original casing from JSON keys which are already well-formatted
    return headerKey;
  };

  const systemError = investigations.length === 1 && investigations[0]['Location Color'] === 'Error' && investigations[0].NPC === 'System';

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <ClipboardList className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Investigations</CardTitle>
        </div>
        <CardDescription>Browse investigation details loaded from Google Sheets.</CardDescription>
      </CardHeader>
      <CardContent>
        {systemError ? (
          <Alert variant="destructive" className="max-w-lg text-center mx-auto">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <AlertTitle>System Error</AlertTitle>
            <AlertDescription>
              {investigations[0].Description || "Could not load Investigation data. Please check logs."}
            </AlertDescription>
          </Alert>
        ) : investigations.length > 0 ? (
          <Table>
            <TableCaption>A list of investigation encounters.</TableCaption>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{formatHeader(header)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {investigations.map((investigation, index) => (
                <TableRow key={`investigation-${index}`}>
                  {headers.map((header) => (
                    <TableCell key={`${header}-${index}`}>
                      {String(investigation[header] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert variant="default" className="max-w-md text-center mx-auto border-dashed border-muted-foreground/50">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <AlertTitle>No Investigation Data</AlertTitle>
            <AlertDescription>
              No investigation data found. Please ensure your Google Sheet is set up correctly and contains data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
