import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Character Sheet - Beast Companion',
  description: 'Manage your character stats for Beast.',
};

export default function CharacterSheetPage() {
  return (
    <div className="w-full">
      <CharacterSheetUI />
    </div>
  );
}
