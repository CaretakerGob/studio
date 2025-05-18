
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
import { List } from "lucide-react";

// Define the expected structure of an item
export interface ItemData {
  Insert?: string; 
  Count?: string;  
  Color: string;
  Type: string;
  Description: string;
}

interface ItemListUIProps {
  items: ItemData[];
  title: string;
  cardDescription: string;
}

export function ItemListUI({ items, title, cardDescription }: ItemListUIProps) {
  // Define which headers to display
  const displayedHeaders: Array<keyof ItemData> = ["Color", "Type", "Description"];

  // Determine actual headers present in the first item, but only include those we want to display
  const headersToRender = items.length > 0 
    ? Object.keys(items[0]).filter(header => displayedHeaders.includes(header as keyof ItemData)) as Array<keyof ItemData>
    : displayedHeaders;

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <List className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 && !(items.length === 1 && items[0].Type === 'System' && items[0].Color === 'Error') ? (
          <Table>
            <TableCaption>A list of items. Ensure your Google Sheet (specified by \`GOOGLE_SHEET_ID\` and \`GOOGLE_SHEET_RANGE\`) is shared and has the correct columns.</TableCaption>
            <TableHeader>
              <TableRow>
                {headersToRender.map((header) => (
                  <TableHead key={header} className="capitalize">
                    {/* Simple way to add space before caps for display */}
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
                      {String(item[header as keyof ItemData] ?? '')}
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
              : "No item data to display. Please ensure your Google Sheet is set up correctly, shared with the service account, and contains data."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}

