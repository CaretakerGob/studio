
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
  type: 'Melee' | 'Range' | 'Special 1' | 'Special 2' | 'Signature' | string; // Allow string for other attack types
  details: string;
}

export interface EnemyLogic {
  condition: string;
}

export interface EnemyAbility {
  name: string;
  type: string; // e.g., Special 1, Special 2, Signature, Passive
  description: string; // Full ability text
}

export interface Enemy {
  id: string;
  name: string;
  cp?: number;
  template?: string;
  baseStats: EnemyStatBlock;
  baseAttacks: EnemyAttack[];
  logic?: EnemyLogic;
  abilities?: EnemyAbility[]; // For more detailed abilities later
  // rawContent?: string; // For debugging or future complex parsing
}

// Represents an enemy instance in an active encounter
export interface ActiveEnemy extends Enemy {
  instanceId: string;
  currentHp: number;
  currentSanity?: number; // Optional for now
  // Add other trackable instance-specific stats here, e.g., status effects
}
