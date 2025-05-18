
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
import { List } from "lucide-react"; // Could be changed to CalendarDays if more appropriate for "Events"

// Define the expected structure of an event/item from the sheet
export interface EventsSheetData {
  Insert?: string; 
  Count?: string;  
  Color: string;
  Type: string;
  Description: string;
}

interface EventsSheetUIProps {
  items: EventsSheetData[]; // Renamed from items to reflect generic data, or could be events
  title: string;
  cardDescription: string;
}

export function EventsSheetUI({ items, title, cardDescription }: EventsSheetUIProps) {
  // Define which headers to display from the data
  const displayedHeaders: Array<keyof EventsSheetData> = ["Color", "Type", "Description"];

  // Determine actual headers present in the first item, but only include those we want to display
  const headersToRender = items.length > 0 
    ? Object.keys(items[0]).filter(header => displayedHeaders.includes(header as keyof EventsSheetData)) as Array<keyof EventsSheetData>
    : displayedHeaders;

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          {/* Using List icon for now, can be changed */}
          <List className="mr-3 h-8 w-8 text-primary" /> 
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 && !(items.length === 1 && items[0].Type === 'System' && items[0].Color === 'Error') ? (
          <Table>
            <TableCaption>
              {title === "Events" 
                ? "A list of game events from Google Sheets. Ensure your Google Sheet (specified by `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_RANGE`) is shared and has the correct columns."
                : "A list of items."
              }
            </TableCaption>
            <TableHeader>
              <TableRow>
                {headersToRender.map((header) => (
                  <TableHead key={header} className="capitalize">
                    {header.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`item-${index}`}>
                  {headersToRender.map((header) => (
                    <TableCell key={`${header}-${index}`}>
                      {String(item[header as keyof EventsSheetData] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {items.length > 0 && items[0].Type === 'System' && items[0].Color === 'Error'
              ? items[0].Description
              : `No ${title.toLowerCase()} data to display. Please check your setup.`
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
