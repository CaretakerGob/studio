
import { MissionTrackerUI } from "@/components/mission-tracker/mission-tracker-ui";
import { parseHorrorJournal } from '@/lib/enemy-parser';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Tracker - Beast Companion',
  description: 'Track your missions, enemies, and objectives.',
};

export default async function MissionTrackerPage() {
  const enemies = await parseHorrorJournal();
  
  return (
    <div className="w-full">
      <MissionTrackerUI initialEnemies={enemies} />
    </div>
  );
}
