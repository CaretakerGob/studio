
import { ItemGeneratorUI } from "@/components/item-generator/item-generator-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Item Generator - Beast Companion',
  description: 'Use AI to generate unique items for your Beast game sessions.',
};

export default function ItemGeneratorPage() {
  return (
    <div className="w-full">
      <ItemGeneratorUI />
    </div>
  );
}
