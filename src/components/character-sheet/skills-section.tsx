
"use client";

import type { Character, SkillDefinition, SkillName, Skills } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, UserMinus, UserPlus, Library, PersonStanding, Laptop, Star, VenetianMask, HeartHandshake, Wrench, Search, BookMarked, Smile, Leaf, ClipboardList, SlidersHorizontal } from 'lucide-react';
import { SkillDisplayItem } from './skill-display-item';

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

// Constants for skill costs and max level are no longer needed here as custom character is removed

interface SkillsSectionProps {
  editableCharacterData: Character;
  characterSkills: Skills;
  skillDefinitions: SkillDefinition[];
  // Props related to custom skill purchasing removed
  skillToPurchase: SkillName | undefined; // Unused
  setSkillToPurchase: (skillId: SkillName | undefined) => void; // Unused
  handlePurchaseSkill: () => void; // Unused
  handleIncreaseSkillLevel: (skillId: SkillName) => void; // Unused
  handleDecreaseSkillLevel: (skillId: SkillName) => void; // Unused
  handleRemoveSkill: (skillId: SkillName) => void; // Unused
  purchasedSkills: SkillDefinition[]; // Unused
}

export function SkillsSection({
  editableCharacterData,
  characterSkills, // Still needed to display skills for predefined characters
  skillDefinitions,
  // Removed props: skillToPurchase, setSkillToPurchase, handlePurchaseSkill, handleIncreaseSkillLevel, handleDecreaseSkillLevel, handleRemoveSkill, purchasedSkills
}: SkillsSectionProps) {

  // Custom character skill management UI removed

  // Display for non-custom characters (now all characters)
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 flex items-center"><Library className="mr-2 h-6 w-6 text-primary" /> Skills</h3>
      {(() => {
        const relevantSkillDefinitions = skillDefinitions.filter(def => ((editableCharacterData.skills as Skills)[def.id as SkillName] ?? 0) > 0);
        if (relevantSkillDefinitions.length === 0) {
          return <p className="text-muted-foreground text-center py-4 bg-card/50 rounded-md">This character has no specialized skills.</p>;
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantSkillDefinitions.map(def => <SkillDisplayItem key={def.id} def={def} editableCharacterData={editableCharacterData} />)}
          </div>
        );
      })()}
    </div>
  );
}
