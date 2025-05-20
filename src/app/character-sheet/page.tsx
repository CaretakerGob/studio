
import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { Metadata } from 'next';
import { google } from 'googleapis';
import type { ArsenalCard, ArsenalItem, ArsenalItemCategory, ParsedStatModifier } from '@/types/arsenal';
import type { StatName } from '@/types/character'; // For stat name validation

export const metadata: Metadata = {
  title: 'Character Sheet - Beast Companion',
  description: 'Manage your character stats for Beast.',
};

// Helper function to parse stat change strings like "Max HP +1" or "DEF -2"
// This is a simplified parser and might need to be made more robust
function parseEffectStatChange(statString: string | undefined): ParsedStatModifier[] {
  if (!statString || typeof statString !== 'string' || statString.trim() === '') {
    return [];
  }
  const modifiers: ParsedStatModifier[] = [];
  // Split by common delimiters like comma or semicolon if multiple changes are in one string
  const changes = statString.split(/[,;]/).map(s => s.trim()).filter(Boolean);

  const statMap: Record<string, StatName | 'meleeAttackMod' | 'rangedAttackMod' | 'rangedRangeMod'> = {
    'max hp': 'maxHp', 'maxhp': 'maxHp', 'hp': 'hp',
    'mv': 'mv', 'movement': 'mv',
    'def': 'def', 'defense': 'def',
    'sanity': 'sanity', 'max sanity': 'maxSanity', 'maxsanity': 'maxSanity',
    'melee attack': 'meleeAttackMod', 'meleeattackmod': 'meleeAttackMod',
    'ranged attack': 'rangedAttackMod', 'rangedattackmod': 'rangedAttackMod',
    'ranged range': 'rangedRangeMod', 'rangedrangemod': 'rangedRangeMod',
  };

  for (const change of changes) {
    const match = change.toLowerCase().match(/([\w\s]+)\s*([+-])\s*(\d+)/);
    if (match) {
      const rawStatName = match[1].trim();
      const operator = match[2];
      const value = parseInt(match[3], 10);
      
      const targetStat = statMap[rawStatName] || rawStatName.replace(/\s+/g, ''); // Normalize: "Max HP" -> "maxhp"

      if (targetStat) {
        modifiers.push({
          targetStat: targetStat as string, // Cast for now
          value: operator === '+' ? value : -value,
        });
      }
    }
  }
  return modifiers;
}


async function getArsenalCardsFromGoogleSheet(): Promise<ArsenalCard[]> {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    ARSENAL_CARDS_GOOGLE_SHEET_ID,
    ARSENAL_CARDS_GOOGLE_SHEET_RANGE,
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!ARSENAL_CARDS_GOOGLE_SHEET_ID) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_ID');
  if (!ARSENAL_CARDS_GOOGLE_SHEET_RANGE) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Arsenal Cards Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables are correctly set in your .env.local file.`;
    console.error(detailedErrorMessage);
    return [{ id: 'error-arsenal', name: 'System Error', description: detailedErrorMessage, items:[] } as ArsenalCard];
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: ARSENAL_CARDS_GOOGLE_SHEET_ID,
      range: ARSENAL_CARDS_GOOGLE_SHEET_RANGE, // This range should cover all rows for all arsenals
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Arsenal Cards Google Sheet ID: ${ARSENAL_CARDS_GOOGLE_SHEET_ID} at range: ${ARSENAL_CARDS_GOOGLE_SHEET_RANGE}.`);
      return [{ id: 'warning-arsenal', name: 'System Warning', description: 'No arsenal card data found.', items: [] } as ArsenalCard];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => h.trim().toLowerCase());

    const getColumnIndex = (headerNameVariations: string[]) => {
      for (const variation of headerNameVariations) {
        const index = sanitizedHeaders.indexOf(variation.toLowerCase());
        if (index !== -1) return index;
      }
      return -1;
    };
    
    const arsenalNameIndex = getColumnIndex(['arsenal name', 'arsenalname']);
    if (arsenalNameIndex === -1) {
        const errorMsg = "Critical Error: 'Arsenal Name' column not found in Google Sheet.";
        console.error(errorMsg);
        return [{ id: 'error-critical-arsenal', name: 'Sheet Error', description: errorMsg, items: [] }];
    }

    const arsenalsMap = new Map<string, ArsenalCard>();

    rows.slice(1).forEach((row: any[], rowIndex: number) => {
      const currentArsenalName = row[arsenalNameIndex] ? String(row[arsenalNameIndex]).trim() : `Unnamed Arsenal ${rowIndex}`;
      if (!currentArsenalName) return; // Skip rows with no arsenal name

      const arsenalId = currentArsenalName.toLowerCase().replace(/\s+/g, '_');

      if (!arsenalsMap.has(arsenalId)) {
        // First time seeing this arsenal, create its base card
        // We'll assume the first row for an Arsenal Name might contain global mods or image URLs
        const card: Partial<ArsenalCard> = {
            id: arsenalId,
            name: currentArsenalName,
            items: [],
        };
        
        const descIndex = getColumnIndex(['description']); // General description for the Arsenal itself
        if (descIndex !== -1) card.description = String(row[descIndex] || '');

        const imageUrlFrontIndex = getColumnIndex(['imageurlfront', 'frontimage', 'imagefront']);
        if (imageUrlFrontIndex !== -1) card.imageUrlFront = String(row[imageUrlFrontIndex] || '');
        
        const imageUrlBackIndex = getColumnIndex(['imageurlback', 'backimage', 'imageback']);
        if (imageUrlBackIndex !== -1) card.imageUrlBack = String(row[imageUrlBackIndex] || '');
        
        // Simplified: Assume global mods might be on the first row for an arsenal.
        // More robust: Could be specific "Arsenal Card Meta" row or separate sheet.
        const numModFields = ['hpMod', 'maxHpMod', 'mvMod', 'defMod', 'sanityMod', 'maxSanityMod', 'meleeAttackMod', 'rangedAttackMod', 'rangedRangeMod'];
        const headerToFieldMap: Record<string, keyof ArsenalCard> = {
            'hpmod': 'hpMod', 'hp mod': 'hpMod',
            'maxhpmod': 'maxHpMod', 'max hp mod': 'maxHpMod',
            'mvmod': 'mvMod', 'mv mod': 'mvMod',
            'defmod': 'defMod', 'def mod': 'defMod',
            'sanitymod': 'sanityMod', 'sanity mod': 'sanityMod',
            'maxsanitymod': 'maxSanityMod', 'max sanity mod': 'maxSanityMod',
            'meleeattackmod': 'meleeAttackMod', 'melee attack mod': 'meleeAttackMod',
            'rangedattackmod': 'rangedAttackMod', 'ranged attack mod': 'rangedAttackMod',
            'rangedrangemod': 'rangedRangeMod', 'ranged range mod': 'rangedRangeMod',
        };

        numModFields.forEach(field => {
          let colIndex = -1;
          colIndex = sanitizedHeaders.indexOf(field.toLowerCase() as string);
          if (colIndex === -1) {
              const possibleHeaders = Object.keys(headerToFieldMap).filter(h => headerToFieldMap[h] === field);
              for (const headerVariation of possibleHeaders) {
                  colIndex = getColumnIndex([headerVariation]);
                  if (colIndex !== -1) break;
              }
          }
          if (colIndex !== -1 && row[colIndex] !== undefined && String(row[colIndex]).trim() !== '') {
            const val = parseFloat(String(row[colIndex]));
            if (!isNaN(val)) {
              (card as any)[field] = val;
            }
          }
        });
        arsenalsMap.set(arsenalId, card as ArsenalCard);
      }

      // Create ArsenalItem from the current row
      const item: Partial<ArsenalItem> = {};
      item.id = `${arsenalId}_item_${rowIndex}`; // Simple unique ID for the item

      const categoryIndex = getColumnIndex(['category']);
      if (categoryIndex !== -1) item.category = String(row[categoryIndex] || '').toUpperCase() as ArsenalItemCategory;
      
      const levelIndex = getColumnIndex(['level']);
      if (levelIndex !== -1 && row[levelIndex]) item.level = parseInt(String(row[levelIndex]), 10);

      const qtyIndex = getColumnIndex(['qty', 'quantity']);
      if (qtyIndex !== -1 && row[qtyIndex]) item.qty = parseInt(String(row[qtyIndex]), 10);

      const cdIndex = getColumnIndex(['cd', 'cooldown']);
      if (cdIndex !== -1) item.cd = String(row[cdIndex] || '');

      const abilityNameIndex = getColumnIndex(['ability name', 'abilityname', 'item name', 'itemname']);
      item.abilityName = abilityNameIndex !== -1 ? String(row[abilityNameIndex] || '') : `Item ${rowIndex}`;
      
      const itemTypeIndex = getColumnIndex(['type']); // e.g., Shotgun, Armor for WEAPON/GEAR
      if (itemTypeIndex !== -1) item.type = String(row[itemTypeIndex] || '');
      
      const classIndex = getColumnIndex(['class']); // e.g., Ranged weapon
      if (classIndex !== -1) item.class = String(row[classIndex] || '');
      
      const itemDescIndex = getColumnIndex(['description']); // Description specific to the item
      if (itemDescIndex !== -1 && item.abilityName !== (arsenalsMap.get(arsenalId)?.description)) { // Avoid re-assigning arsenal desc
        item.itemDescription = String(row[itemDescIndex] || '');
      }
      
      const effectIndex = getColumnIndex(['effect']);
      if (effectIndex !== -1) item.effect = String(row[effectIndex] || '');
      
      const secondaryEffectIndex = getColumnIndex(['secondary effect', 'secondaryeffect']);
      if (secondaryEffectIndex !== -1) item.secondaryEffect = String(row[secondaryEffectIndex] || '');
      
      const toggleIndex = getColumnIndex(['toggle']);
      if (toggleIndex !== -1) item.toggle = ['true', 'yes', '1'].includes(String(row[toggleIndex] || '').toLowerCase());
      
      const effectStatChangeIndex = getColumnIndex(['effect stat change', 'effectstatchange']);
      if (effectStatChangeIndex !== -1) {
        item.effectStatChangeString = String(row[effectStatChangeIndex] || '');
        item.parsedStatModifiers = parseEffectStatChange(item.effectStatChangeString);
      }
      
      const secondaryEffectStatChangeIndex = getColumnIndex(['secondary effect stat change', 'secondaryeffectstatchange']);
       if (secondaryEffectStatChangeIndex !== -1) {
        // item.secondaryEffectStatChangeString = String(row[secondaryEffectStatChangeIndex] || '');
        // item.parsedSecondaryEffectStatChanges = parseEffectStatChange(item.secondaryEffectStatChangeString);
        // For now, let's assume secondary effects are descriptive or handled by more complex logic later
      }
      
      const weaponIndex = getColumnIndex(['weapon']); // e.g., A4/R2 – Ranged Shotgun
      if (weaponIndex !== -1) item.weaponDetails = String(row[weaponIndex] || '');

      // Add the parsed item to its arsenal
      const arsenal = arsenalsMap.get(arsenalId);
      if (arsenal && item.abilityName) { // Only add if it has a name
        arsenal.items.push(item as ArsenalItem);
      }
    });

    return Array.from(arsenalsMap.values());

  } catch (error) {
    console.error("Error fetching Arsenal Card data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ id: 'error-arsenal-fetch', name: 'System Error', description: `Could not load Arsenal Card data. Error: ${errorMessage}`, items: [] } as ArsenalCard];
  }
}

export default async function CharacterSheetPage() {
  const arsenalCards = await getArsenalCardsFromGoogleSheet();
  return (
    <div className="w-full">
      <CharacterSheetUI arsenalCards={arsenalCards} />
    </div>
  );
}
