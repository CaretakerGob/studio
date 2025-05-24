
import { ShopUI } from "@/components/shop/shop-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Whispers & Wares - Shop',
  description: 'Browse and purchase unique items for your adventures.',
};

export default function ShopPage() {
  return (
    <div className="w-full">
      <ShopUI />
    </div>
  );
}
