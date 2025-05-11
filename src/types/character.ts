export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mv: number;
  def: number;
  sanity: number;
  maxSanity: number;
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
  abilities: Ability[];
  avatarSeed?: string;
  meleeWeapon?: Weapon;
  rangedWeapon?: RangedWeapon;
}

