export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity' | 'atk' | 'rng';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mv: number;
  def: number;
  sanity: number;
  maxSanity: number;
  atk: number;
  rng: number;
}

export interface CharacterStatDefinition {
  id: StatName;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export type AbilityType = "Action" | "Interrupt" | "Passive";

export interface Ability {
  id: string;
  name: string;
  type: AbilityType;
  description: string;
  // Optional fields based on common game mechanics
  cost?: string; // e.g., "1 Action Point", "3 Sanity"
  range?: string; // e.g., "Melee", "5 spaces"
  cooldown?: string; // e.g., "2 rounds"
  details?: string; // For stats like A4/R5
}

export interface Character {
  id: string;
  name: string;
  baseStats: CharacterStats;
  abilities: Ability[];
  avatarSeed?: string; // For character avatar image
}
