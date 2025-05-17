

export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity';
export type SkillName = 
  'ath' | 
  'cpu' |
  'dare' |
  'dec' | 
  'emp' | 
  'eng' |
  'inv' |
  'kno' | 
  'occ' | 
  'pers' |
  'sur' | 
  'tac' | 
  'tun';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mv: number;
  def: number;
  sanity: number;
  maxSanity: number;
}

export interface Skills {
  ath?: number;
  cpu?: number;
  dare?: number;
  dec?: number;
  emp?: number;
  eng?: number;
  inv?: number;
  kno?: number;
  occ?: number;
  pers?: number;
  sur?: number;
  tac?: number;
  tun?: number;
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
  maxQuantity?: number; // Added for consumable charges
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
  skills?: Skills; 
  abilities: Ability[];
  avatarSeed?: string;
  imageUrl?: string; 
  meleeWeapon?: Weapon;
  rangedWeapon?: RangedWeapon;
  characterPoints?: number;
}

