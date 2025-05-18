
export interface InvestigationData {
  'Location Color': string;
  '1d6 Roll': string; // Keeping as string for simplicity from sheet, can be parsed if needed
  NPC: string;
  Unit: string;
  Persona: string;
  Demand: string;
  'Skill Check': string;
  Goals: string;
  Passive: string;
  [key: string]: string | number; // Index signature for dynamic access
}
