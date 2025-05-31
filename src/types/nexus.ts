
export interface PartyMemberSavedState {
  baseCharacterId: string; // e.g., "gob", "custom_123" // This is the ID from charactersData or a unique ID for saved custom chars
  characterName: string; // The name of the character (could be custom)
  characterImageUrl?: string; // Optional image URL
  selectedArsenalId: string | null;
  currentHp: number;
  currentSanity: number;
  currentMv: number;
  currentDef: number;
  sessionBleedPoints: number;
  sessionMaxHpModifier: number;
  sessionMaxSanityModifier: number;
  sessionMvModifier: number;
  sessionDefModifier: number;
  sessionMeleeAttackModifier: number;
  sessionRangedAttackModifier: number;
  sessionRangedRangeModifier: number;
  abilityCooldowns: Record<string, number>; 
  abilityQuantities: Record<string, number>;
}

export interface SavedNexusState {
  id: string; // Firestore document ID
  name: string; // User-given name for this saved state
  userId: string; // UID of the user who saved this state
  lastSaved: string; // ISO date string
  
  party: PartyMemberSavedState[]; // Array of party member states
  activeCharacterIdInSession: string | null; // ID of the character (baseCharacterId from PartyMemberSavedState) that was active

  // Global session data (not per-character)
  sessionCrypto: number; 
}
