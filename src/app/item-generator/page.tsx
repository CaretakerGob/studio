
import { ItemGeneratorUI } from "@/components/item-generator/item-generator-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item Generator - RotB Companion',
  description: 'Generate unique items for your RotB game sessions.',
};

export default function ItemGeneratorPage() {
  return (
    <div className="w-full">
      <ItemGeneratorUI />
    </div>
  );
}
