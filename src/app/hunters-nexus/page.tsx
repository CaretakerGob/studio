
import { HuntersNexusUI } from "@/components/hunters-nexus/hunters-nexus-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hunter\'s Nexus - Beast Companion',
  description: 'Session-based, multiplayer game management hub for Riddle of the Beast.',
};

export default function HuntersNexusPage() {
  return (
    <div className="w-full h-full">
      <HuntersNexusUI />
    </div>
  );
}
