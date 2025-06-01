
export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity' | 'meleeAttack' | 'rangedAttack' | 'rangedRange'; // Added rangedAttack & rangedRange
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
  meleeAttack?: number;
  rangedAttack?: number; // Added
  rangedRange?: number;  // Added
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

export type AbilityType = "Action" | "Interrupt" | "Passive" | "FREE Action";

export interface Ability {
  id: string;
  name: string;
  type: AbilityType;
  description: string;
  cost?: number | undefined;
  range?: string;
  cooldown?: string;
  details?: string;
  maxQuantity?: number;
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
  id: string; // For templates, this is 'gob', 'custom', etc. For saved instances, it's the Firestore doc ID.
  templateId?: string; // Explicitly store the original template ID for saved instances.
  name: string;
  baseStats: CharacterStats;
  skills?: Skills;
  abilities: Ability[];
  avatarSeed?: string;
  imageUrl?: string; // This will be the front image
  backImageUrl?: string; // Optional back image
  meleeWeapon?: Weapon;
  rangedWeapon?: RangedWeapon;
  characterPoints?: number;
  crypto?: number;
  bleedPoints?: number;
  selectedArsenalCardId?: string | null;
  savedCooldowns?: Record<string, number>;
  savedQuantities?: Record<string, number>;
  lastSaved?: string;
}

    
