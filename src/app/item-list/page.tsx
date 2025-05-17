
import { ItemListUI } from "@/components/item-list/item-list-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion',
  description: 'View a list of items from the game.',
};

export default function ItemListPage() {
  return (
    <div className="w-full">
      <ItemListUI />
    </div>
  );
}
