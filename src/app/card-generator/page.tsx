import { CardGeneratorUI } from "@/components/card-generator/card-generator-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Card Generator - Beast Companion',
  description: 'Generate random cards for your Beast game sessions.',
};

export default function CardGeneratorPage() {
  return (
    <div className="w-full">
      <CardGeneratorUI />
    </div>
  );
}
