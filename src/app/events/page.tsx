
import { EventsSheetUI, type EventsSheetData } from "@/components/events/events-sheet-ui"; // Updated import
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion', // This page is linked as "Item List"
  description: 'View a list of items from the game.',
};

// This page is for the "/events" route, which is linked by "Item List" in the sidebar.
// It will display an empty item list for now, using the renamed component.
export default async function EmptyItemListPage() {
  const items: EventsSheetData[] = []; // Use the new type
  return (
    <div className="w-full">
      <EventsSheetUI // Updated component usage
        items={items} 
        title="Item List" // This page is titled "Item List"
        cardDescription="View a list of items."
      />
    </div>
  );
}
