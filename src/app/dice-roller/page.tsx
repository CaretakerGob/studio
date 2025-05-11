import { DiceRollerUI } from "@/components/dice-roller/dice-roller-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dice Roller - Beast Companion',
  description: 'Roll dice for your Beast game sessions.',
};

export default function DiceRollerPage() {
  return (
    <div className="w-full">
      <DiceRollerUI />
    </div>
  );
}
