import { TurnTrackerUI } from "@/components/turn-tracker/turn-tracker-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turn Tracker - Beast Companion',
  description: 'Manage player turns for your Beast game sessions.',
};

export default function TurnTrackerPage() {
  return (
    <div className="w-full">
      <TurnTrackerUI />
    </div>
  );
}
