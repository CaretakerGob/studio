
export interface EnemyArmor {
  name: string;
  effect: string;
}

export interface EnemyStatBlock {
  hp?: number;
  mv?: number;
  def?: number;
  san?: number;
  armor?: EnemyArmor;
  [key: string]: any; // For other potential stats from markdown
}

export interface EnemyAttack {
  type: 'Melee' | 'Range' | 'Special 1' | 'Special 2' | 'Signature' | string;
  details: string;
}

export interface EnemyLogic {
  condition: string;
}

export interface EnemyAbility {
  name: string;
  type: string;
  description: string;
}

// New interface for stat modifiers
export type StatModifierName = 'HP' | 'MV' | 'Def' | 'San' | 'MeleeAttackBonus' | 'RangedAttackBonus' | 'MaxHP' | 'MaxSanity'; // Add more as needed

export interface StatModifier {
  stat: StatModifierName; // e.g., 'Def', 'HP', 'MV', 'MeleeAttackBonus'
  value: number; // e.g., 2 for "+2 DEF", -1 for "-1 MV"
}

// New interface for enemy variations
export interface EnemyVariation {
  name: string; // e.g., "Animated Armor"
  statChanges: StatModifier[]; // e.g., [{ stat: 'Def', value: 2 }]
  abilities?: EnemyAbility[]; // Optional: if variations also have unique abilities
}

export interface Enemy {
  id: string;
  name: string;
  cp?: number;
  template?: string;
  baseStats: EnemyStatBlock;
  baseAttacks: EnemyAttack[];
  logic?: EnemyLogic;
  abilities?: EnemyAbility[];
  variations?: EnemyVariation[]; // Added to hold variations
}

export interface ActiveEnemy extends Enemy {
  instanceId: string;
  currentHp: number;
  currentSanity?: number;
  selectedVariationName?: string; // To know which variation is active
}
