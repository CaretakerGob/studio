

import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { Metadata } from 'next';
import { google } from 'googleapis';
import type { ArsenalCard, ArsenalItem, ArsenalItemCategory, ParsedStatModifier } from '@/types/arsenal';
import type { StatName, CharacterStats } from '@/types/character'; // For stat name validation

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
    'melee attack': 'meleeAttackMod', 'meleeattackmod': 'meleeAttackMod', // This maps to arsenal card global mods
    'ranged attack': 'rangedAttackMod', 'rangedattackmod': 'rangedAttackMod',
    'ranged range': 'rangedRangeMod', 'rangedrangemod': 'rangedRangeMod',
    // Note: 'meleeAttack' for CharacterStats is handled by parsePetStatsString if it's for a pet
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
  
  const match = detailsStr.match(/A(\d+)(?:\s*[\/-]?\s*R(\d+))?/i);

  if (match) {
    if (match[1]) { 
      parsed.attack = parseInt(match[1], 10);
    }
    if (match[2]) { 
      parsed.range = parseInt(match[2], 10);
    }
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

  if (stats.hp !== undefined && stats.maxHp === undefined) {
    stats.maxHp = stats.hp;
  }
  if (stats.sanity !== undefined && stats.maxSanity === undefined) {
    stats.maxSanity = stats.sanity;
  }
  
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
    const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase()); 
    
    const getColumnIndex = (headerNameVariations: string[]) => {
      for (const variation of headerNameVariations) {
        const index = sanitizedHeaders.indexOf(variation.toLowerCase());
        if (index !== -1) return index;
      }
      return -1;
    };
    
    const arsenalNameIndex = getColumnIndex(['arsenal name', 'arsenalname', 'name', 'title']);
    if (arsenalNameIndex === -1) {
        const errorMsg = `Critical Error: 'Arsenal Name' (or 'Name', 'Title') column not found in Google Sheet. Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error(errorMsg);
        console.log('[DEBUG] Sanitized Headers from Google Sheet:', sanitizedHeaders);
        return [{ id: 'error-critical-arsenal', name: 'Sheet Error', description: errorMsg, items: [{ id: 'error-item', abilityName: `[${sanitizedHeaders.join(', ')}]` } as ArsenalItem] }];
    }
    
    const petFlagColumnVariations = ['pet', 'is pet', 'companion'];
    const petFlagHeaderIndex = getColumnIndex(petFlagColumnVariations);
    if (petFlagHeaderIndex === -1) {
        console.warn(`[DATA WARNING] No column found for Pet flag. Expected one of: ${petFlagColumnVariations.join('/')}. Pets might not be identified correctly.`);
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
        
        const arsenalDescIndex = getColumnIndex(['arsenal description']); 
        if (arsenalDescIndex !== -1) card.description = String(row[arsenalDescIndex] || '');
        else {
            const genericDescIndex = getColumnIndex(['description']); 
            if (genericDescIndex !== -1) card.description = String(row[genericDescIndex] || '');
        }

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

      const item: Partial<ArsenalItem> = {};
      item.id = `${arsenalId}_item_${rowIndex}`; 
      item.isPet = false; 

      const categoryIndex = getColumnIndex(['category']);
      if (categoryIndex !== -1) item.category = String(row[categoryIndex] || '').toUpperCase() as ArsenalItemCategory;
      
      const levelIndex = getColumnIndex(['level']);
      if (levelIndex !== -1 && row[levelIndex] && String(row[levelIndex]).trim() !== '') {
         const parsedLevel = parseInt(String(row[levelIndex]), 10);
         if(!isNaN(parsedLevel)) item.level = parsedLevel;
      }

      const qtyIndex = getColumnIndex(['qty', 'quantity']);
      if (qtyIndex !== -1 && row[qtyIndex] && String(row[qtyIndex]).trim() !== '') {
        const parsedQty = parseInt(String(row[qtyIndex]), 10);
        if(!isNaN(parsedQty)) item.qty = parsedQty;
      }

      const cdIndex = getColumnIndex(['cd', 'cooldown']);
      if (cdIndex !== -1) item.cd = String(row[cdIndex] || '');

      const abilityNameIndex = getColumnIndex(['ability name', 'abilityname', 'item name', 'itemname']);
      item.abilityName = abilityNameIndex !== -1 ? String(row[abilityNameIndex] || '').trim() : `Item ${rowIndex}`;
      
      const itemTypeIndex = getColumnIndex(['type']); 
      if (itemTypeIndex !== -1) item.type = String(row[itemTypeIndex] || '');
      
      const classIndex = getColumnIndex(['class']); 
      if (classIndex !== -1) item.class = String(row[classIndex] || '');
      
      const itemDescIndex = getColumnIndex(['item description', 'ability description', 'effect description']); 
      if (itemDescIndex !== -1 && String(row[itemDescIndex] || '').trim() !== '') {
        item.itemDescription = String(row[itemDescIndex] || '');
      } else {
         const genericDescIndex = getColumnIndex(['description']); 
         if (genericDescIndex !== -1 && String(row[genericDescIndex] || '').trim() !== '' && String(row[genericDescIndex] || '') !== arsenalsMap.get(arsenalId)?.description) {
            item.itemDescription = String(row[genericDescIndex] || '');
         }
      }
      
      const effectIndex = getColumnIndex(['effect']);
      if (effectIndex !== -1) item.effect = String(row[effectIndex] || '');
      
      const secondaryEffectIndex = getColumnIndex(['secondary effect', 'secondaryeffect']);
      if (secondaryEffectIndex !== -1) item.secondaryEffect = String(row[secondaryEffectIndex] || '');
      
      const toggleIndex = getColumnIndex(['toggle']);
      if (toggleIndex !== -1) item.toggle = ['true', 'yes', '1', 'y'].includes(String(row[toggleIndex] || '').toLowerCase());
      
      const effectStatChangeIndex = getColumnIndex(['effect stat change', 'effectstatchange']);
      if (effectStatChangeIndex !== -1 && row[effectStatChangeIndex]) {
        item.effectStatChangeString = String(row[effectStatChangeIndex] || '');
        item.parsedStatModifiers = parseEffectStatChange(item.effectStatChangeString);
      }
      
      const weaponFlagColumnIndex = getColumnIndex(['weapon']);
      if (weaponFlagColumnIndex !== -1 && row[weaponFlagColumnIndex]) {
        item.isFlaggedAsWeapon = ['true', 'yes', '1', 'y'].includes(String(row[weaponFlagColumnIndex] || '').toLowerCase());
      }

      const weaponStatsStringColumnIndex = getColumnIndex(['weapon details', 'effect description', 'effect', 'stats']);
      if (weaponStatsStringColumnIndex !== -1 && row[weaponStatsStringColumnIndex]) {
        const statsStr = String(row[weaponStatsStringColumnIndex] || '').trim();
        if (statsStr) {
          item.weaponDetails = statsStr; 
          item.parsedWeaponStats = parseWeaponDetailsString(item.weaponDetails);
        }
      }
      
      const currentPetFlagColumnIndex = petFlagHeaderIndex; 
      if (currentPetFlagColumnIndex !== -1 && row[currentPetFlagColumnIndex] !== undefined && String(row[currentPetFlagColumnIndex]).trim() !== '') {
        const petFlagValue = String(row[currentPetFlagColumnIndex]).trim().toLowerCase();
        if (['true', 'yes', '1', 'y'].includes(petFlagValue)) {
            item.isPet = true;

            const itemAbilityNameValue = String(item.abilityName || '').trim(); 

            if (itemAbilityNameValue && !itemAbilityNameValue.startsWith('Item ') && itemAbilityNameValue !== `Item ${rowIndex}`) {
                item.petName = itemAbilityNameValue;
                // console.log(`[Pet Name Parsing] Pet '${item.petName}' used 'Ability Name': "${itemAbilityNameValue}"`);
            } else {
                item.petName = 'Companion';
                // console.log(`[Pet Name Parsing] Pet defaulted to 'Companion' because 'Ability Name' was placeholder or missing.`);
            }


            const petStatsRawString = String(row[getColumnIndex(['pet stats', 'companion stats'])] || '').trim();
            if (petStatsRawString) { 
              item.petStats = petStatsRawString;
              const parsed = parsePetStatsString(item.petStats);
              item.parsedPetCoreStats = parsed;
              if (!parsed || Object.keys(parsed).length === 0) {
                console.warn(`[Pet Stats Parsing] Pet '${item.petName || item.abilityName}' has a 'Pet Stats' column ("${item.petStats}"), but parsing failed or yielded no stats. Parsed object: ${JSON.stringify(parsed)}. Trackers may not display.`);
                item.parsedPetCoreStats = undefined; 
              }
            } else {
                const effectStatChangeForPet = String(row[getColumnIndex(['effect stat change', 'effectstatchange'])] || '').trim();
                if (effectStatChangeForPet && !item.parsedStatModifiers?.length) { 
                    const parsedFromEffect = parsePetStatsString(effectStatChangeForPet);
                    item.parsedPetCoreStats = parsedFromEffect;
                    if (parsedFromEffect && Object.keys(parsedFromEffect).length > 0) {
                        item.petStats = effectStatChangeForPet; 
                        console.warn(`[Pet Stats Parsing] Pet '${item.petName || item.abilityName}' has no 'Pet Stats' column. Used 'Effect Stat Change': "${effectStatChangeForPet}"`);
                    } else {
                        item.parsedPetCoreStats = undefined;
                        console.warn(`[Pet Stats Parsing] Failed to parse pet stats from 'Effect Stat Change' for '${item.petName || item.abilityName}'. Parsed object: ${JSON.stringify(parsedFromEffect)}. Trackers may not display.`);
                    }
                } else {
                   console.warn(`[Pet Stats Parsing] Pet '${item.petName || item.abilityName}' has no 'Pet Stats' column and no suitable 'Effect Stat Change' to parse. Trackers may not display.`);
                   item.parsedPetCoreStats = undefined;
                }
            }


            const petAbilitiesColumnIndex = getColumnIndex(['pet abilities', 'companion abilities']);
            if (petAbilitiesColumnIndex !== -1) {
                const abilitiesStr = String(row[petAbilitiesColumnIndex] || '').trim();
                if (abilitiesStr) item.petAbilities = abilitiesStr;
            }
        }
      }

      // Ability type flags
      const trueValues = ['true', 'yes', '1', 'y'];
      const isActionIndex = getColumnIndex(['is action', 'isaction']);
      if (isActionIndex !== -1) item.isAction = trueValues.includes(String(row[isActionIndex] || '').toLowerCase());
      
      const isInterruptIndex = getColumnIndex(['is interrupt', 'isinterrupt']);
      if (isInterruptIndex !== -1) item.isInterrupt = trueValues.includes(String(row[isInterruptIndex] || '').toLowerCase());

      const isPassiveIndex = getColumnIndex(['is passive', 'ispassive']);
      if (isPassiveIndex !== -1) item.isPassive = trueValues.includes(String(row[isPassiveIndex] || '').toLowerCase());

      const isFreeActionIndex = getColumnIndex(['is free action', 'isfreeaction']);
      if (isFreeActionIndex !== -1) item.isFreeAction = trueValues.includes(String(row[isFreeActionIndex] || '').toLowerCase());
      
      const arsenal = arsenalsMap.get(arsenalId);
      if (arsenal) {
        const isPlaceholderName = item.abilityName === `Item ${rowIndex}`;
        const isMeaningfulItem = !isPlaceholderName ||
                                 item.isPet ||
                                 item.isFlaggedAsWeapon ||
                                 item.category ||
                                 (item.itemDescription && item.itemDescription.trim() !== '') ||
                                 (item.effect && item.effect.trim() !== '');
        
        if (isMeaningfulItem) {
          if (item.isPet && isPlaceholderName && !item.petName) {
            item.petName = 'Companion'; 
          }
          arsenal.items.push(item as ArsenalItem);
        }
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

