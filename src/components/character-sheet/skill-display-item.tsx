
"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { SkillDefinition, Skills, SkillName } from '@/types/character';
import type { Character } from '@/types/character';
import { Library, PersonStanding, Laptop, Star, VenetianMask, HeartHandshake, Wrench, Search, BookMarked, Smile, Leaf, ClipboardList, SlidersHorizontal } from "lucide-react";


// Mapping skill IDs to icons
const skillIconMap: Record<SkillName, React.ElementType> = {
    ath: PersonStanding,
    cpu: Laptop,
    dare: Star,
    dec: VenetianMask,
    emp: HeartHandshake,
    eng: Wrench,
    inv: Search,
    kno: Library,
    occ: BookMarked,
    pers: Smile,
    sur: Leaf,
    tac: ClipboardList,
    tun: SlidersHorizontal,
};


interface SkillDisplayItemProps {
  def: SkillDefinition;
  editableCharacterData: Character | null; // Make sure Character type is imported or defined
}

export function SkillDisplayItem({ def, editableCharacterData }: SkillDisplayItemProps) {
  if (!editableCharacterData || !editableCharacterData.skills) return null;
  const skillValue = (editableCharacterData.skills as Skills)[def.id as SkillName] || 0;
  
  // Hide if skillValue is 0 for non-custom characters
  if (skillValue === 0 && editableCharacterData.id !== 'custom') return null;

  const IconComponent = skillIconMap[def.id as SkillName] || Library; // Default to Library if no specific icon

  return (
    <div className="p-3 rounded-lg border border-border bg-card/50 shadow-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor={def.id} className="flex items-center text-md font-medium">
          <IconComponent className="mr-2 h-5 w-5 text-primary" />
          {def.label}
        </Label>
        <span className="text-lg font-bold text-primary">{skillValue}</span>
      </div>
      {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
    </div>
  );
}
