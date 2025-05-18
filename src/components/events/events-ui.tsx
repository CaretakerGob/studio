
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
import { CalendarDays } from "lucide-react";
import type { EventData } from "@/types/event";

interface EventsUIProps {
  events: EventData[];
}

export function EventsUI({ events }: EventsUIProps) {
  const headers = events.length > 0 ? Object.keys(events[0]) : ["eventName", "date", "location", "description", "outcome"];

  // Helper to format header keys for display (e.g., eventName -> Event Name)
  const formatHeader = (headerKey: string) => {
    return headerKey
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <CalendarDays className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Game Events</CardTitle>
        </div>
        <CardDescription>Upcoming and past game events, loaded from Google Sheets.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 && !(events.length === 1 && events[0].eventName === 'Error' && events[0].location === 'System') ? (
          <Table>
            <TableCaption>A list of game events.</TableCaption>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{formatHeader(header)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={`event-${index}`}>
                  {headers.map((header) => (
                    <TableCell key={`${header}-${index}`}>
                      {String(event[header as keyof EventData] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {events.length > 0 && events[0].location === 'System' && events[0].eventName === 'Error'
              ? events[0].description 
              : "No event data to display. Please ensure your Google Sheet is set up correctly and contains data."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
