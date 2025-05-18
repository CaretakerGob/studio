
"use client";

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface EventsSheetData {
  Insert?: string;
  Count?: string;
  Color: string;
  Type: string;
  Description: string;
}

interface EventsSheetUIProps {
  items: EventsSheetData[];
  title: string;
  cardDescription: string;
}

export function EventsSheetUI({ items, title, cardDescription }: EventsSheetUIProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    if (items && items.length > 0) {
      const uniqueColors = Array.from(new Set(items.map(item => item.Color).filter(Boolean) as string[]));
      setAvailableColors(uniqueColors.sort());
    } else {
      setAvailableColors([]);
    }
  }, [items]);

  const handleColorChange = (value: string) => {
    setSelectedColor(value === "all" ? undefined : value);
  };

  const filteredItems = selectedColor
    ? items.filter(item => item.Color === selectedColor)
    : items;

  const displayedHeaders: Array<keyof EventsSheetData> = ["Color", "Type", "Description"];

  const headersToRender = items.length > 0
    ? Object.keys(items[0]).filter(header => displayedHeaders.includes(header as keyof EventsSheetData)) as Array<keyof EventsSheetData>
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
        <div className="mb-6">
          <Label htmlFor="color-select" className="text-lg font-medium">Filter by Color:</Label>
          <Select value={selectedColor || "all"} onValueChange={handleColorChange}>
            <SelectTrigger id="color-select" className="w-full md:w-72 mt-1">
              <SelectValue placeholder="Select a Color..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {availableColors.map(color => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredItems.length > 0 && !(filteredItems.length === 1 && filteredItems[0].Type === 'System' && filteredItems[0].Color === 'Error') ? (
          <Table>
            <TableCaption>
              {title === "Events"
                ? `A list of game events from Google Sheets ${selectedColor ? `filtered by color: ${selectedColor}` : '(showing all colors)'}. Ensure your Google Sheet (specified by \`GOOGLE_SHEET_ID\` and \`GOOGLE_SHEET_RANGE\`) is shared and has the correct columns.`
                : `A list of items ${selectedColor ? `filtered by color: ${selectedColor}` : '(showing all colors)'}.`}
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
              {filteredItems.map((item, index) => (
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
              ? items[0].Description // Show system error if that's the only item
              : selectedColor 
                ? `No ${title.toLowerCase()} data to display for the color "${selectedColor}".`
                : `No ${title.toLowerCase()} data to display. Please check your setup.`
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
