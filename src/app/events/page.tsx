
import { ItemListUI, type ItemData } from "@/components/item-list/item-list-ui"; // Still using ItemListUI for structure
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion', // This page is linked as "Item List"
  description: 'View a list of items from the game.',
};

// This page is for the "/events" route, which is linked by "Item List" in the sidebar.
// It will display an empty item list for now.
export default async function EmptyItemListPage() {
  const items: ItemData[] = []; // Empty array for items
  return (
    <div className="w-full">
      <ItemListUI 
        items={items} 
        title="Item List"
        cardDescription="View a list of items."
      />
    </div>
  );
}
