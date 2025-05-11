export interface CharacterStatDefinition {
  id: StatName;
  label: string;
  icon: React.ElementType;
  description?: string;
}

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
