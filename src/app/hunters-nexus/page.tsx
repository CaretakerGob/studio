
import { HuntersNexusUI } from "@/components/hunters-nexus/hunters-nexus-ui";
import type { Metadata } from 'next';
// Arsenal fetching is removed as it's no longer used by HuntersNexusUI directly

export const metadata: Metadata = {
  title: 'Hunter\'s Nexus - Beast Companion',
  description: 'Session-based, multiplayer game management hub for Riddle of the Beast.',
};

export default async function HuntersNexusPage() {
  // const arsenalCardsData = await getArsenalCardsFromGoogleSheet(); // Removed
  return (
    <div className="w-full h-full">
      <HuntersNexusUI /> {/* Removed arsenalCards prop */}
    </div>
  );
}
