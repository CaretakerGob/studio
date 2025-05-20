
import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { Metadata } from 'next';
import { google } from 'googleapis';
import type { ArsenalCard, ArsenalItem, ArsenalItemCategory, ParsedStatModifier } from '@/types/arsenal';
import type { StatName } from '@/types/character'; // For stat name validation

export const metadata: Metadata = {
  title: 'Character Sheet - Beast Companion',
  description: 'Manage your character stats for Beast.',
};

function parseEffectStatChange(statString: string | undefined): ParsedStatModifier[] {
  if (!statString || typeof statString !== 'string' || statString.trim() === '') {
    return [];
  }
  const modifiers: ParsedStatModifier[] = [];
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
    const match = change.toLowerCase().match(/([a-zA-Z\s]+)\s*([+-])\s*(\d+)/);
    if (match) {
      const rawStatName = match[1].trim();
      const operator = match[2];
      const value = parseInt(match[3], 10);
      
      const targetStat = statMap[rawStatName] || rawStatName.replace(/\s+/g, ''); 

      if (targetStat) {
        modifiers.push({
          targetStat: targetStat as string, 
          value: operator === '+' ? value : -value,
        });
      }
    }
  }
  return modifiers;
}

function parseWeaponDetailsString(detailsStr?: string): { attack?: number; range?: number; rawDetails: string } | undefined {
  if (!detailsStr || typeof detailsStr !== 'string' || detailsStr.trim() === '') return undefined;

  const parsed: { attack?: number; range?: number; rawDetails: string } = { rawDetails: detailsStr };
  
  // Regex to capture A<number>/R<number> or A<number>
  // Example: "A4/R2 – Ranged Shotgun" or "A3"
  const match = detailsStr.match(/A(\d+)(?:\/R(\d+))?/i);

  if (match) {
    if (match[1]) { // Attack value
      parsed.attack = parseInt(match[1], 10);
    }
    if (match[2]) { // Range value (optional)
      parsed.range = parseInt(match[2], 10);
    }
  }
  
  // Return only if attack was found, or if rawDetails itself is meaningful (e.g. for flavor if no stats)
  // For now, we primarily care if attack was parsed for it to be a weapon stat object
  return parsed.attack !== undefined ? parsed : { rawDetails: detailsStr }; // Ensure rawDetails is always returned if input was valid
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
      range: ARSENAL_CARDS_GOOGLE_SHEET_RANGE, 
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
      if (!currentArsenalName) return; 

      const arsenalId = currentArsenalName.toLowerCase().replace(/\s+/g, '_');

      if (!arsenalsMap.has(arsenalId)) {
        const card: Partial<ArsenalCard> = {
            id: arsenalId,
            name: currentArsenalName,
            items: [],
        };
        
        const arsenalDescIndex = getColumnIndex(['arsenal description', 'description']); // Description for the Arsenal Card itself
        if (arsenalDescIndex !== -1) card.description = String(row[arsenalDescIndex] || '');

        const imageUrlFrontIndex = getColumnIndex(['imageurlfront', 'frontimage', 'imagefront']);
        if (imageUrlFrontIndex !== -1) card.imageUrlFront = String(row[imageUrlFrontIndex] || '');
        
        const imageUrlBackIndex = getColumnIndex(['imageurlback', 'backimage', 'imageback']);
        if (imageUrlBackIndex !== -1) card.imageUrlBack = String(row[imageUrlBackIndex] || '');
        
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
          // First, try direct match (e.g., 'hpMod')
          colIndex = sanitizedHeaders.indexOf(field.toLowerCase() as string);
          // If not found, try variations from headerToFieldMap
          if (colIndex === -1) {
              const possibleHeaders = Object.keys(headerToFieldMap).filter(h => headerToFieldMap[h] === field);
              for (const headerVariation of possibleHeaders) {
                  colIndex = getColumnIndex([headerVariation]); // getColumnIndex already handles case-insensitivity
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

      const item: Partial<ArsenalItem> = {};
      item.id = `${arsenalId}_item_${rowIndex}`; 

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
      
      const itemTypeIndex = getColumnIndex(['type']); 
      if (itemTypeIndex !== -1) item.type = String(row[itemTypeIndex] || '');
      
      const classIndex = getColumnIndex(['class']); 
      if (classIndex !== -1) item.class = String(row[classIndex] || '');
      
      // Use a different description index for items vs the arsenal card itself.
      const itemDescIndex = getColumnIndex(['item description', 'ability description', 'effect description']); 
      if (itemDescIndex !== -1) {
        item.itemDescription = String(row[itemDescIndex] || '');
      } else {
         const genericDescIndex = getColumnIndex(['description']); // Fallback to generic 'description' if specific not found
         if (genericDescIndex !== -1 && String(row[genericDescIndex] || '') !== arsenalsMap.get(arsenalId)?.description) {
            item.itemDescription = String(row[genericDescIndex] || '');
         }
      }
      
      const effectIndex = getColumnIndex(['effect']);
      if (effectIndex !== -1) item.effect = String(row[effectIndex] || '');
      
      const secondaryEffectIndex = getColumnIndex(['secondary effect', 'secondaryeffect']);
      if (secondaryEffectIndex !== -1) item.secondaryEffect = String(row[secondaryEffectIndex] || '');
      
      const toggleIndex = getColumnIndex(['toggle']);
      if (toggleIndex !== -1) item.toggle = ['true', 'yes', '1'].includes(String(row[toggleIndex] || '').toLowerCase());
      
      const effectStatChangeIndex = getColumnIndex(['effect stat change', 'effectstatchange']);
      if (effectStatChangeIndex !== -1 && row[effectStatChangeIndex]) {
        item.effectStatChangeString = String(row[effectStatChangeIndex] || '');
        item.parsedStatModifiers = parseEffectStatChange(item.effectStatChangeString);
      }
      
      const weaponDetailsIndex = getColumnIndex(['weapon', 'weapondetails']);
      if (weaponDetailsIndex !== -1 && row[weaponDetailsIndex]) {
        item.weaponDetails = String(row[weaponDetailsIndex] || '');
        if (item.category === 'WEAPON' || (item.category === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) {
          item.parsedWeaponStats = parseWeaponDetailsString(item.weaponDetails);
        }
      }
      
      const arsenal = arsenalsMap.get(arsenalId);
      if (arsenal && item.abilityName) { 
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
