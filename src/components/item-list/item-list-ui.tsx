
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

// Updated Item interface
interface Item {
  id: string | number;
  color: string;
  type: string;
  description: string;
}

// Updated sample data
const sampleItems: Item[] = [
  { id: 1, color: "Red", type: "Potion", description: "Heals a small amount of HP." },
  { id: 2, color: "Blue", type: "Scroll", description: "Casts a minor illusion spell." },
  { id: 3, color: "Green", type: "Herb", description: "Cures poison status effect." },
  { id: 'q4', color: "Gold", type: "Amulet", description: "Provides +1 to Defense.", },
  { id: 5, color: "Black", type: "Dagger", description: "A short, sharp blade." },
];

export function ItemListUI() {
  const items = sampleItems;
  const headers = items.length > 0 ? Object.keys(items[0]) : [];

  // Filter out 'id' from headers to display, as it's an internal identifier
  const displayHeaders = headers.filter(header => header !== 'id');

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <List className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Item List</CardTitle>
        </div>
        <CardDescription>Browse through the available items. (Data is currently placeholder)</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <Table>
            <TableCaption>A list of items. Please provide your full Excel data to populate this table.</TableCaption>
            <TableHeader>
              <TableRow>
                {displayHeaders.map((header) => (
                  <TableHead key={header} className="capitalize">
                    {header.replace(/([A-Z])/g, ' $1').trim()} {/* Add space before caps for display */}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {displayHeaders.map((header) => (
                    <TableCell key={`${item.id}-${header}`}>
                      {String(item[header as keyof Omit<Item, 'id'>] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No item data to display. Please provide a sample of your Excel data.</p>
        )}
      </CardContent>
    </Card>
  );
}
