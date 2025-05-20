
"use client";

import type { Character, SkillDefinition, SkillName, Skills } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, UserMinus, UserPlus, Library, PersonStanding, Laptop, Star, VenetianMask, HeartHandshake, Wrench, Search, BookMarked, Smile, Leaf, ClipboardList, SlidersHorizontal } from 'lucide-react';
import { SkillDisplayItem } from './skill-display-item'; // Assuming SkillDisplayItem is created

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


const SKILL_COST_LEVEL_1 = 10;
const SKILL_COST_LEVEL_2 = 5;
const SKILL_COST_LEVEL_3 = 10;
const MAX_SKILL_LEVEL = 3;

interface SkillsSectionProps {
  editableCharacterData: Character;
  characterSkills: Skills;
  skillDefinitions: SkillDefinition[];
  skillToPurchase: SkillName | undefined;
  setSkillToPurchase: (skillId: SkillName | undefined) => void;
  handlePurchaseSkill: () => void;
  handleIncreaseSkillLevel: (skillId: SkillName) => void;
  handleDecreaseSkillLevel: (skillId: SkillName) => void;
  handleRemoveSkill: (skillId: SkillName) => void;
  purchasedSkills: SkillDefinition[];
}

export function SkillsSection({
  editableCharacterData,
  characterSkills,
  skillDefinitions,
  skillToPurchase,
  setSkillToPurchase,
  handlePurchaseSkill,
  handleIncreaseSkillLevel,
  handleDecreaseSkillLevel,
  handleRemoveSkill,
  purchasedSkills,
}: SkillsSectionProps) {
  
  if (editableCharacterData.id === 'custom') {
    return (
      <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-lg bg-card/30">
        <h3 className="text-xl font-semibold text-primary flex items-center">
          <Library className="mr-2 h-6 w-6" /> Manage Custom Skills
        </h3>
        <p className="text-sm text-muted-foreground">Available CP: {editableCharacterData.characterPoints}</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div className="w-full">
            <Label htmlFor="skillPurchaseSelect" className="text-sm text-muted-foreground">Choose a skill to add (Cost: {SKILL_COST_LEVEL_1} CP for Level 1):</Label>
            <Select value={skillToPurchase} onValueChange={(value) => setSkillToPurchase(value as SkillName)}>
              <SelectTrigger id="skillPurchaseSelect">
                <SelectValue placeholder="Select a skill to purchase" />
              </SelectTrigger>
              <SelectContent>
                {skillDefinitions
                  .filter(def => (characterSkills[def.id as SkillName] || 0) === 0)
                  .map(def => (
                  <SelectItem key={def.id} value={def.id} disabled={(editableCharacterData.characterPoints || 0) < SKILL_COST_LEVEL_1}>
                    {def.label} - {SKILL_COST_LEVEL_1} CP
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handlePurchaseSkill}
            disabled={!skillToPurchase || (editableCharacterData.characterPoints || 0) < SKILL_COST_LEVEL_1}
            className="bg-primary hover:bg-primary/90"
          >
            Add Skill
          </Button>
        </div>
        <Separator className="my-4"/>
        {purchasedSkills.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-muted-foreground">Purchased Skills:</h4>
            {purchasedSkills.map(skillDef => {
              const currentLevel = characterSkills[skillDef.id as SkillName] || 0;
              let upgradeCost = 0;
              if (currentLevel === 1) upgradeCost = SKILL_COST_LEVEL_2;
              else if (currentLevel === 2) upgradeCost = SKILL_COST_LEVEL_3;
              const IconComp = skillIconMap[skillDef.id as SkillName] || Library;

              return (
                <Card key={skillDef.id} className="p-3 bg-card/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {IconComp && <IconComp className="mr-2 h-5 w-5 text-primary" />}
                      <span className="font-medium">{skillDef.label} - Level {currentLevel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDecreaseSkillLevel(skillDef.id as SkillName)}
                        disabled={currentLevel <= 0} // Should allow decrease to 0 if remove handles it
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleIncreaseSkillLevel(skillDef.id as SkillName)}
                        disabled={currentLevel >= MAX_SKILL_LEVEL || (editableCharacterData.characterPoints || 0) < upgradeCost}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveSkill(skillDef.id as SkillName)}
                        disabled={currentLevel === 0}
                      >
                          <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                  {currentLevel < MAX_SKILL_LEVEL && currentLevel > 0 && <p className="text-xs text-muted-foreground mt-1">Next Level Cost: {upgradeCost} CP</p>}
                   <p className="text-xs text-muted-foreground mt-1">{skillDef.description}</p>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No skills purchased yet.</p>
        )}
      </div>
    );
  }

  // Display for non-custom characters
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
