
export interface SavedNexusState {
  id: string; // Firestore document ID
  name: string; // User-given name for this saved state
  userId: string; // UID of the user who saved this state
  lastSaved: string; // ISO date string

  baseCharacterId: string; // The ID of the character template this state is based on (e.g., "gob", "custom")
  selectedArsenalId: string | null;

  currentHp: number;
  currentSanity: number;
  currentMv: number;
  currentDef: number;

  sessionMaxHpModifier: number;
  sessionMaxSanityModifier: number;
  sessionMvModifier: number;
  sessionDefModifier: number;
  sessionMeleeAttackModifier: number;
  sessionRangedAttackModifier: number;
  sessionRangedRangeModifier: number;

  sessionCrypto: number;

  abilityCooldowns: Record<string, number>; 
  abilityQuantities: Record<string, number>;
}
