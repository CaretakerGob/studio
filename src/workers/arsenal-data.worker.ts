import type { ArsenalCard, ArsenalItem, ArsenalItemCategory, ParsedStatModifier } from '@/types/arsenal';
import type { StatName, CharacterStats } from '@/types/character';

// Helper functions (moved from character-sheet/page.tsx)
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

  const match = detailsStr.match(/A(\d+)(?:\\s*[\\/-]?\\s*R(\\d+))?/i);

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

// Helper function to get column index (simplified for worker)
function getColumnIndex(headerVariations: string[], sanitizedHeaders: string[]): number {
    if (!sanitizedHeaders || sanitizedHeaders.length === 0 || !headerVariations || headerVariations.length === 0) {
        return -1;
    }
    const lowerCaseVariations = headerVariations.map(v => v.toLowerCase());
    for (const variation of lowerCaseVariations) {
        const index = sanitizedHeaders.indexOf(variation);
        if (index !== -1) return index;
    }
    return -1;
}

// Main data processing logic (moved and adapted from getArsenalCardsFromGoogleSheet)
function processArsenalData(rows: string[][]): ArsenalCard[] {
  if (!rows || rows.length === 0) {
    console.warn(`Worker: No data rows received for processing.`);
    return [];
  }

  const headers = rows[0] as string[];
  const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase()); // Sanitize headers in the worker

  const arsenalNameIndex = getColumnIndex(['arsenal name', 'arsenalname', 'name', 'title'], sanitizedHeaders);
    if (arsenalNameIndex === -1) {
        const errorMsg = `Worker: Critical Error: 'Arsenal Name' (or 'Name', 'Title') column not found in Google Sheet. Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error(errorMsg);
        // Return an error structure or handle as needed by the main thread
        return [{ id: 'error-critical-arsenal-worker', name: 'Sheet Error', description: errorMsg, items: [{ id: 'error-item-header-worker', abilityName: `Headers found: [${sanitizedHeaders.join(', ')}]` } as ArsenalItem] }];
    }

    const petFlagColumnVariations = ['pet', 'is pet', 'companion'];
    const petFlagHeaderIndex = getColumnIndex(petFlagColumnVariations, sanitizedHeaders);
    if (petFlagHeaderIndex === -1) {
        console.warn(`Worker: [DATA WARNING] No column found for Pet flag. Expected one of: ${petFlagColumnVariations.join('/')}. Pets might not be identified correctly.`);
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

      const arsenalDescIndex = getColumnIndex(['arsenal description'], sanitizedHeaders);
      if (arsenalDescIndex !== -1) card.description = String(row[arsenalDescIndex] || '');
      else {
          const genericDescIndex = getColumnIndex(['description'], sanitizedHeaders);
          if (genericDescIndex !== -1) card.description = String(row[genericDescIndex] || '');
      }

      const imageUrlFrontIndex = getColumnIndex(['imageurlfront', 'frontimage', 'imagefront'], sanitizedHeaders);
      if (imageUrlFrontIndex !== -1) card.imageUrlFront = String(row[imageUrlFrontIndex] || '');

      const imageUrlBackIndex = getColumnIndex(['imageurlback', 'backimage', 'imageback'], sanitizedHeaders);
      if (imageUrlBackIndex !== -1) card.imageUrlBack = String(row[imageUrlBackIndex] || '');

      const numModFields: (keyof ArsenalCard)[] = ['hpMod', 'maxHpMod', 'mvMod', 'defMod', 'sanityMod', 'maxSanityMod', 'meleeAttackMod', 'rangedAttackMod', 'rangedRangeMod'];
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
                colIndex = getColumnIndex([headerVariation], sanitizedHeaders);
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

    const item: Partial<ArsenalItem> = { isPet: false };
    item.id = `${arsenalId}_item_${rowIndex}`;

    const categoryIndex = getColumnIndex(['category'], sanitizedHeaders);
    if (categoryIndex !== -1) item.category = String(row[categoryIndex] || '').toUpperCase() as ArsenalItemCategory;

    const levelIndex = getColumnIndex(['level'], sanitizedHeaders);
    if (levelIndex !== -1 && row[levelIndex] && String(row[levelIndex]).trim() !== '') {
       const parsedLevel = parseInt(String(row[levelIndex]), 10);
       if(!isNaN(parsedLevel)) item.level = parsedLevel;
    }

    const qtyIndex = getColumnIndex(['qty', 'quantity'], sanitizedHeaders);
    if (qtyIndex !== -1 && row[qtyIndex] && String(row[qtyIndex]).trim() !== '') {
      const parsedQty = parseInt(String(row[qtyIndex]), 10);
      if(!isNaN(parsedQty)) item.qty = parsedQty;
    }

    const cdIndex = getColumnIndex(['cd', 'cooldown'], sanitizedHeaders);
    if (cdIndex !== -1) item.cd = String(row[cdIndex] || '');

    const abilityNameIndex = getColumnIndex(['ability name', 'abilityname', 'item name', 'itemname'], sanitizedHeaders);
    item.abilityName = abilityNameIndex !== -1 ? String(row[abilityNameIndex] || '').trim() : `Item ${rowIndex}`;

    const itemTypeIndex = getColumnIndex(['type'], sanitizedHeaders);
    if (itemTypeIndex !== -1) item.type = String(row[itemTypeIndex] || '');

    const classIndex = getColumnIndex(['class'], sanitizedHeaders);
    if (classIndex !== -1) item.class = String(row[classIndex] || '');

    const itemDescIndex = getColumnIndex(['item description', 'ability description', 'effect description'], sanitizedHeaders);
    if (itemDescIndex !== -1 && String(row[itemDescIndex] || '').trim() !== '') {
      item.itemDescription = String(row[itemDescIndex] || '');
    } else {
       const genericDescIndex = getColumnIndex(['description'], sanitizedHeaders);
       if (genericDescIndex !== -1 && String(row[genericDescIndex] || '').trim() !== '' && String(row[genericDescIndex] || '') !== arsenalsMap.get(arsenalId)?.description) {
          item.itemDescription = String(row[genericDescIndex] || '');
       }
    }

    const effectIndex = getColumnIndex(['effect'], sanitizedHeaders);
    if (effectIndex !== -1) item.effect = String(row[effectIndex] || '');

    const secondaryEffectIndex = getColumnIndex(['secondary effect', 'secondaryeffect'], sanitizedHeaders);
    if (secondaryEffectIndex !== -1) item.secondaryEffect = String(row[secondaryEffectIndex] || '');

    const toggleIndex = getColumnIndex(['toggle'], sanitizedHeaders);
    if (toggleIndex !== -1) item.toggle = ['true', 'yes', '1', 'y'].includes(String(row[toggleIndex] || '').toLowerCase());

    const effectStatChangeIndex = getColumnIndex(['effect stat change', 'effectstatchange'], sanitizedHeaders);
    if (effectStatChangeIndex !== -1 && row[effectStatChangeIndex]) {
      item.effectStatChangeString = String(row[effectStatChangeIndex] || '');
      item.parsedStatModifiers = parseEffectStatChange(item.effectStatChangeString);
    }

    const weaponFlagColumnIndex = getColumnIndex(['weapon'], sanitizedHeaders);
    if (weaponFlagColumnIndex !== -1 && row[weaponFlagColumnIndex]) {
      item.isFlaggedAsWeapon = ['true', 'yes', '1', 'y'].includes(String(row[weaponFlagColumnIndex] || '').toLowerCase());
    }

    const weaponStatsStringColumnIndex = getColumnIndex(['weapon details', 'effect description', 'effect', 'stats'], sanitizedHeaders);
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
          } else {
              item.petName = 'Companion'; // Default if ability name is placeholder
          }

          const petStatsRawString = String(row[getColumnIndex(['pet stats', 'companion stats'], sanitizedHeaders)] || '').trim();
          if (petStatsRawString) {
            item.petStats = petStatsRawString;
            const parsed = parsePetStatsString(item.petStats);
            item.parsedPetCoreStats = parsed;
             if (!parsed || Object.keys(parsed).length === 0) {
                console.warn(`Worker: [Pet Stats Parsing] Pet '${item.petName || item.abilityName}' has a 'Pet Stats' column ("${item.petStats}"), but parsing failed or yielded no stats. Parsed object: ${JSON.stringify(parsed)}. Trackers may not display.`);
                item.parsedPetCoreStats = undefined;
              }
          } else {
              const effectStatChangeForPet = String(row[getColumnIndex(['effect stat change', 'effectstatchange'], sanitizedHeaders)] || '').trim();
              if (effectStatChangeForPet && !item.parsedStatModifiers?.length) {
                  const parsedFromEffect = parsePetStatsString(effectStatChangeForPet);
                  item.parsedPetCoreStats = parsedFromEffect;
                  if (parsedFromEffect && Object.keys(parsedFromEffect).length > 0) {
                      item.petStats = effectStatChangeForPet;
                      console.warn(`Worker: [Pet Stats Parsing] Pet '${item.petName || item.abilityName}' has no 'Pet Stats' column. Used 'Effect Stat Change': "${effectStatChangeForPet}" for stats. Parsed: ${JSON.stringify(parsedFromEffect)}`);
                  } else {
                      item.parsedPetCoreStats = undefined;
                  }
              } else {
                   item.parsedPetCoreStats = undefined;
              }
          }

          const petAbilitiesColumnIndex = getColumnIndex(['pet abilities', 'companion abilities'], sanitizedHeaders);
          if (petAbilitiesColumnIndex !== -1) {
              const abilitiesStr = String(row[petAbilitiesColumnIndex] || '').trim();
              if (abilitiesStr) item.petAbilities = abilitiesStr;
          }
      }
    }

    const trueValues = ['true', 'yes', '1', 'y'];
    const isActionIndex = getColumnIndex(['is action', 'isaction'], sanitizedHeaders);
    if (isActionIndex !== -1) item.isAction = trueValues.includes(String(row[isActionIndex] || '').toLowerCase());

    const isInterruptIndex = getColumnIndex(['is interrupt', 'isinterrupt'], sanitizedHeaders);
    if (isInterruptIndex !== -1) item.isInterrupt = trueValues.includes(String(row[isInterruptIndex] || '').toLowerCase());

    const isPassiveIndex = getColumnIndex(['is passive', 'ispassive'], sanitizedHeaders);
    if (isPassiveIndex !== -1) item.isPassive = trueValues.includes(String(row[isPassiveIndex] || '').toLowerCase());

    const isFreeActionIndex = getColumnIndex(['is free action', 'isfreeaction'], sanitizedHeaders);
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
}


// Listen for messages from the main thread
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'processArsenalData') {
    try {
      const rawRows = payload as string[][];
      const processedData = processArsenalData(rawRows);
      // Post the processed data back to the main thread
      self.postMessage({ type: 'arsenalDataProcessed', payload: processedData });
    } catch (error: any) {
      console.error('Worker error processing arsenal data:', error);
      // Post an error message back
      self.postMessage({ type: 'error', payload: error.message || 'Unknown worker error' });
    }
  }
};