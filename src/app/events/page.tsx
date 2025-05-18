
import { ItemListUI, type ItemData } from "@/components/item-list/item-list-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion',
  description: 'View a list of items from the game.',
};

// This page is for the "/events" route, which is linked by "Item List" in the sidebar.
// It will display an empty item list for now.
export default async function ItemListPage() {
  const items: ItemData[] = []; // Empty array for items
  return (
    <div className="w-full">
      <ItemListUI items={items} />
    </div>
  );
}

