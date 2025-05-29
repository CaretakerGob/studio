
import { HuntersNexusUI } from "@/components/hunters-nexus/hunters-nexus-ui";
import type { Metadata } from 'next';
import { google } from 'googleapis';
import type { ArsenalCard, ArsenalItem, ParsedStatModifier, ArsenalItemCategory } from '@/types/arsenal'; // Updated to import all necessary types
import type { CharacterStats, StatName } from '@/types/character'; // For stat name validation

export const metadata: Metadata = {
  title: 'Hunter\'s Nexus - Beast Companion',
  description: 'Session-based, multiplayer game management hub for Riddle of the Beast.',
};

// Helper functions copied from src/app/character-sheet/page.tsx
// These are needed if arsenals have complex items, though for image display only, they might be simplified later.
// For now, including them ensures consistency if more arsenal features are added to Nexus.
function parseEffectStatChange(statString: string | undefined): ParsedStatModifier[] {
  if (!statString || typeof statString !== 'string' || statString.trim() === '') {
    return [];
  }
  const modifiers: ParsedStatModifier[] = [];
  const changes = statString.split(/[,;]/).map(s => s.trim()).filter(Boolean);

  const statNameMap: Record<string, StatName> = {
    'max hp': 'maxHp', 'maxhp': 'maxHp', 'hp': 'hp',
    'mv': 'mv', 'movement': 'mv',
    'def': 'def', 'defense': 'def',
    'sanity': 'sanity', 'max sanity': 'maxSanity', 'maxsanity': 'maxSanity',
    'melee attack': 'meleeAttack',
  };

  for (const change of changes) {
    const match = change.toLowerCase().match(/([a-zA-Z\s]+)\s*([+-])\s*(\d+)/);
    if (match) {
      const rawStatName = match[1].trim().toLowerCase();
      const operator = match[2];
      const value = parseInt(match[3], 10);
      
      const targetStatKey = statNameMap[rawStatName];

      if (targetStatKey) { 
        modifiers.push({
          targetStat: targetStatKey,
          value: operator === '+' ? value : -value,
        });
      } else {
        // console.warn(`[ArsenalParse page.tsx] Skipped unrecognized stat: '${rawStatName}' in '${change}'`);
      }
    }
  }
  return modifiers;
}

function parseWeaponDetailsString(detailsStr?: string): { attack?: number; range?: number; rawDetails: string } | undefined {
  if (!detailsStr || typeof detailsStr !== 'string' || detailsStr.trim() === '') return undefined;
  const parsed: { attack?: number; range?: number; rawDetails: string } = { rawDetails: detailsStr };
  const match = detailsStr.match(/A(\d+)(?:\s*[\/-]?\s*R(\d+))?/i);
  if (match) {
    if (match[1]) parsed.attack = parseInt(match[1], 10);
    if (match[2]) parsed.range = parseInt(match[2], 10);
  }
  return parsed.attack !== undefined ? parsed : { rawDetails: detailsStr };
}

function parsePetStatsString(statsString?: string): Partial<CharacterStats> | undefined {
  if (!statsString || typeof statsString !== 'string' || statsString.trim() === '') {
    return undefined;
  }
  const stats: Partial<CharacterStats> = {};
  const statPattern = /(hp|maxhp|max hp|sanity|san|maxsanity|max sanity|mv|movement|def|defense|melee|melee attack|attack|atk)\s*[:\s]?\s*(\d+)/gi;
  let match;

  while ((match = statPattern.exec(statsString)) !== null) {
    let key = match[1].trim().toLowerCase();
    const value = parseInt(match[2].trim(), 10);

    if (!isNaN(value)) {
      if (key === 'hp') { stats.hp = value; }
      else if (key === 'maxhp' || key === 'max hp') { stats.maxHp = value; }
      else if (key === 'sanity' || key === 'san') { stats.sanity = value; }
      else if (key === 'maxsanity' || key === 'max sanity') { stats.maxSanity = value; }
      else if (key === 'mv' || key === 'movement') { stats.mv = value; }
      else if (key === 'def' || key === 'defense') { stats.def = value; }
      else if (key === 'melee' || key === 'melee attack' || key === 'attack' || key === 'atk') { stats.meleeAttack = value; }
    }
  }
  if (stats.hp !== undefined && stats.maxHp === undefined) stats.maxHp = stats.hp;
  if (stats.sanity !== undefined && stats.maxSanity === undefined) stats.maxSanity = stats.sanity;
  return Object.keys(stats).length > 0 ? stats : undefined;
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
    console.error("[Nexus Page Fetch Error]", detailedErrorMessage);
    return [{ id: 'error-arsenal', name: 'System Error', description: detailedErrorMessage, items:[{id: 'error-item-env', abilityName: detailedErrorMessage} as ArsenalItem], imageUrlFront: '', imageUrlBack: '' } as ArsenalCard];
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
      console.warn(`[Nexus Page Fetch Warning] No data found in Arsenal Cards Google Sheet ID: ${ARSENAL_CARDS_GOOGLE_SHEET_ID} at range: ${ARSENAL_CARDS_GOOGLE_SHEET_RANGE}.`);
      return [{ id: 'warning-arsenal', name: 'System Warning', description: 'No arsenal card data found.', items: [], imageUrlFront: '', imageUrlBack: '' } as ArsenalCard];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase()); 
    
    const getColumnIndex = (headerNameVariations: string[]) => {
      for (const variation of headerNameVariations) {
        const index = sanitizedHeaders.indexOf(variation.toLowerCase());
        if (index !== -1) return index;
      }
      return -1;
    };
    
    const arsenalNameIndex = getColumnIndex(['arsenal name', 'name', 'title']);
    if (arsenalNameIndex === -1) {
        const errorMsg = `Critical Error: 'Arsenal Name' (or 'Name', 'Title') column not found in Google Sheet.`;
        const foundHeadersMsg = `Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error("[Nexus Page Fetch Error]", errorMsg, foundHeadersMsg);
        return [{ id: 'error-critical-arsenal', name: 'Sheet Error', description: `${errorMsg} ${foundHeadersMsg}`, items: [{ id: 'error-item-header', abilityName: foundHeadersMsg } as ArsenalItem], imageUrlFront: '', imageUrlBack: '' }];
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
            imageUrlFront: '',
            imageUrlBack: '',
        };
        
        const arsenalDescIndex = getColumnIndex(['arsenal description', 'description']); 
        if (arsenalDescIndex !== -1) card.description = String(row[arsenalDescIndex] || '');

        const imageUrlFrontIndex = getColumnIndex(['imageurlfront', 'frontimage', 'imagefront', 'imageurl front']);
        if (imageUrlFrontIndex !== -1) card.imageUrlFront = String(row[imageUrlFrontIndex] || '');
        
        const imageUrlBackIndex = getColumnIndex(['imageurlback', 'backimage', 'imageback', 'imageurl back']);
        if (imageUrlBackIndex !== -1) card.imageUrlBack = String(row[imageUrlBackIndex] || '');
        
        // Global stat modifiers for the Arsenal Card itself
        const globalModFields: Record<string, keyof ArsenalCard> = {
            'hpmod': 'hpMod', 'hp mod': 'hpMod', 'maxhpmod': 'maxHpMod', 'max hp mod': 'maxHpMod',
            'mvmod': 'mvMod', 'mv mod': 'mvMod', 'defmod': 'defMod', 'def mod': 'defMod',
            'sanitymod': 'sanityMod', 'sanity mod': 'sanityMod', 'maxsanitymod': 'maxSanityMod', 'max sanity mod': 'maxSanityMod',
            'meleeattackmod': 'meleeAttackMod', 'melee attack mod': 'meleeAttackMod',
            'rangedattackmod': 'rangedAttackMod', 'ranged attack mod': 'rangedAttackMod',
            'rangedrangemod': 'rangedRangeMod', 'ranged range mod': 'rangedRangeMod',
        };
        Object.keys(globalModFields).forEach(headerKey => {
            const fieldKey = globalModFields[headerKey];
            const colIndex = getColumnIndex([headerKey]);
            if (colIndex !== -1 && row[colIndex] !== undefined && String(row[colIndex]).trim() !== '') {
                const val = parseFloat(String(row[colIndex]));
                if (!isNaN(val)) (card as any)[fieldKey] = val;
            }
        });
        arsenalsMap.set(arsenalId, card as ArsenalCard);
      }

      const item: Partial<ArsenalItem> = { isPet: false }; 
      item.id = `${arsenalId}_item_${rowIndex}`; 
      
      const categoryIndex = getColumnIndex(['category']);
      if (categoryIndex !== -1) item.category = String(row[categoryIndex] || '').toUpperCase() as ArsenalItemCategory;
      
      const abilityNameIndex = getColumnIndex(['ability name', 'item name', 'abilityname', 'itemname']);
      item.abilityName = String(row[abilityNameIndex] || '').trim() || `Item ${rowIndex + 2}`;
      
      const itemDescSpecificIndex = getColumnIndex(['item description', 'ability description']);
      if (itemDescSpecificIndex !== -1 && String(row[itemDescSpecificIndex] || '').trim() !== '') {
        item.itemDescription = String(row[itemDescSpecificIndex] || '');
      } else {
         const genericDescIndex = getColumnIndex(['description']); 
         if (genericDescIndex !== -1 && String(row[genericDescIndex] || '').trim() !== '' && String(row[genericDescIndex] || '') !== arsenalsMap.get(arsenalId)?.description) {
            item.itemDescription = String(row[genericDescIndex] || '');
         }
      }
      
      const effectStatChangeIndex = getColumnIndex(['effect stat change', 'effectstatchange']);
      if (effectStatChangeIndex !== -1 && row[effectStatChangeIndex]) {
        const effectStatChangeStringVal = String(row[effectStatChangeIndex] || '').trim();
        if (effectStatChangeStringVal) {
            item.effectStatChangeString = effectStatChangeStringVal;
            item.parsedStatModifiers = parseEffectStatChange(item.effectStatChangeString);
        }
      }

      const weaponStatsStringColumnIndex = getColumnIndex(['weapon details', 'effect description', 'effect', 'stats']);
      if (weaponStatsStringColumnIndex !== -1 && row[weaponStatsStringColumnIndex]) {
        const statsStr = String(row[weaponStatsStringColumnIndex] || '').trim();
        if (statsStr) {
          item.weaponDetails = statsStr; 
          item.parsedWeaponStats = parseWeaponDetailsString(item.weaponDetails);
        }
      }
      
      // ... (other item property parsing logic like isPet, petName, etc., can be kept if needed for consistency)
      const petFlagVariations = ['pet', 'is pet', 'companion'];
      const petFlagHeaderIndex = getColumnIndex(petFlagVariations);
      if (petFlagHeaderIndex !== -1 && row[petFlagHeaderIndex] !== undefined && String(row[petFlagHeaderIndex]).trim() !== '') {
        const petFlagValue = String(row[petFlagHeaderIndex]).trim().toLowerCase();
        if (['true', 'yes', '1', 'y'].includes(petFlagValue)) {
            item.isPet = true;
            item.petName = String(row[getColumnIndex(['pet name', 'companion name'])] || item.abilityName || 'Companion').trim();
            const petStatsRawString = String(row[getColumnIndex(['pet stats', 'companion stats'])] || '').trim();
            if (petStatsRawString) { 
              item.petStats = petStatsRawString;
              item.parsedPetCoreStats = parsePetStatsString(item.petStats);
            } else {
                const effectStatChangeForPet = String(row[effectStatChangeIndex] || '').trim();
                if (item.isPet && effectStatChangeForPet && (!item.parsedStatModifiers || item.parsedStatModifiers.length === 0)) {
                    item.parsedPetCoreStats = parsePetStatsString(effectStatChangeForPet);
                    if (item.parsedPetCoreStats && Object.keys(item.parsedPetCoreStats).length > 0) item.petStats = effectStatChangeForPet;
                    else item.parsedPetCoreStats = undefined;
                } else if (item.isPet) item.parsedPetCoreStats = undefined;
            }
            const petAbilitiesColumnIndex = getColumnIndex(['pet abilities', 'companion abilities']);
            if (petAbilitiesColumnIndex !== -1) {
                const abilitiesStr = String(row[petAbilitiesColumnIndex] || '').trim();
                if (abilitiesStr) item.petAbilities = abilitiesStr;
            }
        }
      }
      
      const arsenal = arsenalsMap.get(arsenalId);
      if (arsenal) {
        const isPlaceholderName = item.abilityName === `Item ${rowIndex + 2}`;
        const isMeaningfulItem = !isPlaceholderName || item.isPet || item.isFlaggedAsWeapon || item.category || (item.itemDescription && item.itemDescription.trim() !== '') || (item.effect && item.effect.trim() !== '');
        if (isMeaningfulItem) {
          arsenal.items.push(item as ArsenalItem);
        }
      }
    });

    return Array.from(arsenalsMap.values());

  } catch (error) {
    console.error("[Nexus Page Fetch Error] Error fetching Arsenal Card data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ id: 'error-arsenal-fetch', name: 'System Error', description: `Could not load Arsenal Card data. Error: ${errorMessage}`, items: [], imageUrlFront: '', imageUrlBack: '' } as ArsenalCard];
  }
}


export default async function HuntersNexusPage() {
  const arsenalCardsData = await getArsenalCardsFromGoogleSheet();
  return (
    <div className="w-full h-full">
      <HuntersNexusUI arsenalCards={arsenalCardsData} />
    </div>
  );
}

