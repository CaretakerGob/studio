
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

// Sample data structure - replace with your actual data
interface Item {
  id: string | number;
  name: string;
  type: string;
  description: string;
  rarity?: string;
}

const sampleItems: Item[] = [
  { id: 1, name: "Placeholder Item 1", type: "Weapon", description: "A basic placeholder weapon.", rarity: "Common" },
  { id: 2, name: "Placeholder Item 2", type: "Armor", description: "Some basic placeholder armor.", rarity: "Common" },
  { id: 3, name: "Placeholder Potion", type: "Consumable", description: "Restores a small amount of something.", rarity: "Uncommon" },
  { id: 'q4', name: "Mystic Scroll", type: "Scroll", description: "A scroll with placeholder enchantments.", rarity: "Rare" },
];

export function ItemListUI() {
  // In a real scenario, this data would likely come from props or be fetched.
  const items = sampleItems;

  // Dynamically get headers from the first item's keys, or define them statically if preferred.
  const headers = items.length > 0 ? Object.keys(items[0]) : [];

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
            <TableCaption>A list of items. Please provide your Excel data sample to populate this table.</TableCaption>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="capitalize">
                    {header.replace(/([A-Z])/g, ' $1').trim()} {/* Add space before caps for display */}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {headers.map((header) => (
                    <TableCell key={`${item.id}-${header}`}>
                      {String(item[header as keyof Item] ?? '')}
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
