
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { ItemListUI, type ItemData } from "@/components/item-list/item-list-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion',
  description: 'View a list of items from the game, loaded from CSV.',
};

async function getItemsFromCSV(): Promise<ItemData[]> {
  const csvFilePath = path.join(process.cwd(), 'public', 'data', 'items.csv');
  try {
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const parsed = Papa.parse<ItemData>(fileContent, {
      header: true, // Assumes the first row of your CSV contains headers (Color,Type,Description)
      skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
      console.error("CSV Parsing Errors:", parsed.errors);
      return []; // Return empty or throw error
    }
    // Ensure data matches ItemData structure. PapaParse with header:true gives correct keys.
    return parsed.data;
  } catch (error) {
    console.error("Error reading or parsing CSV file:", error);
    // Return an empty array or a default list if the file is not found or there's an error
    // This prevents the page from breaking if the CSV is missing during development.
    return [
      { Color: 'Error', Type: 'System', Description: 'Could not load items.csv. Please ensure it exists in public/data/items.csv' }
    ];
  }
}

export default async function ItemListPage() {
  const items = await getItemsFromCSV();
  return (
    <div className="w-full">
      <ItemListUI items={items} />
    </div>
  );
}
