export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity';
export type SkillName = 'tactics' | 'survival' | 'knowledge';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mv: number;
  def: number;
  sanity: number;
  maxSanity: number;
}

export interface Skills {
  tactics?: number;
  survival?: number;
  knowledge?: number;
}

export interface CharacterStatDefinition {
  id: StatName;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export interface SkillDefinition {
  id: SkillName;
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
  cost?: string; 
  range?: string; 
  cooldown?: string; 
  details?: string; 
}

export interface Weapon {
  name: string;
  attack: number;
  flavorText?: string;
}

export interface RangedWeapon extends Weapon {
  range: number;
}

export interface Character {
  id: string;
  name: string;
  baseStats: CharacterStats;
  skills?: Skills; // Added skills
  abilities: Ability[];
  avatarSeed?: string;
  meleeWeapon?: Weapon;
  rangedWeapon?: RangedWeapon;
}

