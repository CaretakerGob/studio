
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
  meleeAttackBonus?: number; 
  rangedAttackBonus?: number; 
  [key: string]: any; 
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

export type StatModifierName = 'HP' | 'MV' | 'Def' | 'San' | 'MeleeAttackBonus' | 'RangedAttackBonus' | 'MaxHP' | 'MaxSanity';

export interface StatModifier {
  stat: StatModifierName; 
  value: number; 
}

export interface EnemyVariation {
  name: string; 
  statChanges: StatModifier[]; 
  abilities?: EnemyAbility[]; 
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
  variations?: EnemyVariation[]; 
}

export interface ActiveEnemy extends Enemy {
  instanceId: string;
  effectiveStats: EnemyStatBlock; // Holds base + variation mods
  currentHp: number; // Tracks damage against effectiveStats.hp
  currentSanity?: number; // Tracks loss against effectiveStats.san
  selectedVariationName?: string;
}
