
import type { Enemy, EnemyStatBlock, EnemyAttack, EnemyArmor, EnemyLogic, EnemyVariation, StatModifier, StatModifierName, EnemyAbility } from '@/types/mission';
import fs from 'fs';
import path from 'path';

function parseCp(line: string): number | undefined {
  const match = line.match(/CP:\s*([\d,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : undefined;
}

function parseTemplate(line: string): string | undefined {
  const match = line.match(/Template:\s*(.*)/i);
  return match ? match[1].trim() : undefined;
}

function parseStatValue(line: string, statName: string): number | undefined {
  const regex = new RegExp(`${statName}:\\s*(-?\\d+)`, 'i'); // Allow negative for modifiers
  const match = line.match(regex);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseStatModifiers(changeStr: string): StatModifier[] {
  const modifiers: StatModifier[] = [];
  if (!changeStr) return modifiers;

  const parts = changeStr.split(',').map(p => p.trim()).filter(Boolean);

  const statNameMap: Record<string, StatModifierName> = {
    'def': 'Def', 'defense': 'Def',
    'hp': 'HP', 'health': 'HP', 'max hp': 'MaxHP',
    'mv': 'MV', 'movement': 'MV',
    'san': 'San', 'sanity': 'San', 'max san': 'MaxSanity', 'max sanity': 'MaxSanity',
    'melee': 'MeleeAttackBonus', 'melee attack': 'MeleeAttackBonus',
    'range': 'RangedAttackBonus', 'range attack': 'RangedAttackBonus', 
    'attack': 'MeleeAttackBonus', 
    'attacks': 'MeleeAttackBonus',
  };

  parts.forEach(part => {
    const match = part.match(/^([+-])?\s*(\d+)\s+([a-zA-Z\s]+)/i);
    if (match) {
      const operator = match[1] || '+'; 
      const value = parseInt(match[2], 10);
      const rawStatName = match[3].trim().toLowerCase();
      
      const mappedStatName = statNameMap[rawStatName];

      if (mappedStatName) {
        modifiers.push({
          stat: mappedStatName,
          value: operator === '+' ? value : -value,
        });
      }
    }
  });
  return modifiers;
}


export async function parseHorrorJournal(): Promise<Enemy[]> {
  const filePath = path.join(process.cwd(), 'Horror Journal Rulebook.md');
  let fileContent: string;
  try {
    fileContent = await fs.promises.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error("Error reading Horror Journal Rulebook.md:", error);
    return [{ 
        id: 'parser-error-indicator', 
        name: 'Parser Error', 
        cp: 0, 
        template: 'Error', 
        baseStats: {}, 
        baseAttacks: [{type: 'Error', details: 'Could not read rulebook file.'}], 
        logic: {condition: ''} 
    }];
  }

  const enemies: Enemy[] = [];
  const enemyBlocks = fileContent.split(/\n(?=#\s)/); 

  for (const block of enemyBlocks) {
    const lines = block.split('\n').map(line => line.trim());
    if (lines.length === 0 || !lines[0].startsWith('# ')) continue;

    const name = lines[0].substring(2).trim();
    if (!name) continue;

    let currentEnemy: Enemy = {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name,
      baseStats: {},
      baseAttacks: [],
      abilities: [],
      variations: [],
    };

    let parsingSection: 'stats' | 'attacks' | 'logic' | 'abilities' | 'armor' | 'variationAbilities' | null = null;
    let currentVariationNameForAbilities: string | null = null;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## Base Stats')) { parsingSection = 'stats'; currentVariationNameForAbilities = null; continue; }
      if (line.startsWith('## Base Attacks')) { parsingSection = 'attacks'; currentVariationNameForAbilities = null; continue; }
      if (line.startsWith('## Logic:')) {
        parsingSection = 'logic'; currentVariationNameForAbilities = null;
        const logicMatch = line.match(/Logic:\s*(.*)/i);
        if (logicMatch && logicMatch[1].trim()) { currentEnemy.logic = { condition: logicMatch[1].trim() }; }
        else if (i + 1 < lines.length && lines[i+1] && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('- CP:')) {
            currentEnemy.logic = { condition: lines[i+1].trim() }; i++;
        }
        continue;
      }
      if (line.startsWith('## Abilities:')) { parsingSection = 'abilities'; currentVariationNameForAbilities = null; continue; }
      if (line.startsWith('### Armor:')) {
        parsingSection = 'armor'; currentVariationNameForAbilities = null;
        const armorNameMatch = line.match(/Armor:\s*(.*)/i);
        if (armorNameMatch && currentEnemy.baseStats) {
          currentEnemy.baseStats.armor = { name: armorNameMatch[1].trim(), effect: '' };
        }
        continue;
      }

      // Specific parser for "Animated Objects Table" like structures
      if (line.match(/^\*\s*Animated Objects Table/i) || (currentEnemy.name === "Drowned Ones" && line.match(/Drowned One/i) && line.match(/Stat changes over Base/i)) || (currentEnemy.name === "Giant Insects" && line.match(/Giant Insect Table/i)) || (currentEnemy.name === "Maniacs" && line.match(/Maniac Table/i)) || (currentEnemy.name === "Killer Plants" && line.match(/Day Time Stat Mods/i))) {
        let tableLineIndex = i + 1;
        // Skip header-like lines
        while (tableLineIndex < lines.length &&
               (lines[tableLineIndex].trim().startsWith('**') ||
                lines[tableLineIndex].trim().toLowerCase() === 'stat changes over base' ||
                lines[tableLineIndex].trim().toLowerCase() === 'night time stat mods' || // for Killer Plants
                lines[tableLineIndex].trim() === '')) {
          tableLineIndex++;
        }

        while (tableLineIndex < lines.length) {
          const currentTableLine = lines[tableLineIndex].trim();
          let variationName = "";
          let statChangeString = "";

          if (currentTableLine.startsWith('#### ')) { // For "Animated Objects" structure
            variationName = currentTableLine.substring(5).trim();
            if (tableLineIndex + 1 < lines.length && lines[tableLineIndex + 1].trim().match(/^([+-]\s*\d+\s+\w+)/)) {
              statChangeString = lines[tableLineIndex + 1].trim();
              tableLineIndex++; // Consumed the stat change line
            }
          } else if (currentTableLine.match(/^[A-Za-z\s]+([+-]\d+\s+\w+.*)/)) { // For Drowned One, Giant Insects, Maniacs (Name then stats on same line separated by many spaces)
             const parts = currentTableLine.split(/\s{2,}/); // Split by 2 or more spaces
             if (parts.length >= 2) {
                variationName = parts[0].trim();
                statChangeString = parts.slice(1).join(" ").trim(); // Join remaining parts for stat string
             }
          } else if (currentEnemy.name === "Killer Plants" && !currentTableLine.startsWith('#') && !currentTableLine.startsWith('*') && currentTableLine.split(/\s{2,}/).length >=2) { // Killer Plant format
            const parts = currentTableLine.split(/\s{2,}/);
             if (parts.length >= 2) { // Expects Name, Day Mod, Night Mod
                variationName = parts[0].trim();
                // For Killer Plants, "Stat changes over base" is implied. We take Day Mods. Night mods could be a separate feature.
                statChangeString = parts[1].trim(); 
             }
          }


          if (variationName && statChangeString) {
            let variation = currentEnemy.variations?.find(v => v.name === variationName);
            if (!variation) {
              if (!currentEnemy.variations) currentEnemy.variations = [];
              variation = { name: variationName, statChanges: [], abilities: [] };
              currentEnemy.variations.push(variation);
            }
            const parsedMods = parseStatModifiers(statChangeString);
            variation.statChanges = [...(variation.statChanges || []), ...parsedMods];
          } else if (currentTableLine.startsWith('#') || currentTableLine.startsWith('___') || currentTableLine.startsWith('**Animated Armor, Animated Sword, Living Painting**') || currentTableLine.startsWith('**Lurch, Brute, Deep Caller**') || currentTableLine.startsWith('**Giant Mantis, Giant Roach, Giant Centipede**') || currentTableLine.startsWith('**Chainsaw, Pyro, Butcher**') || currentTableLine.startsWith('**Venus Trap, Stanglethorn, Corpse Bloom**') ) {
            break; // End of this table section
          }
          tableLineIndex++;
        }
        i = tableLineIndex - 1;
        parsingSection = null;
        continue;
      }
      
      // Generic table parser (like Tenebrae)
      if (line.match(/^\*\s.*Table$/i) && !line.match(/^\*\s*Animated Objects Table/i) && currentEnemy.name !== "Drowned Ones" && currentEnemy.name !== "Giant Insects" && currentEnemy.name !== "Maniacs" && currentEnemy.name !== "Killer Plants") {
        let headerLineIndex = i + 1;
        while(headerLineIndex < lines.length && (lines[headerLineIndex].trim() === "" || lines[headerLineIndex].trim().toLowerCase() === "roll (1d6)")) {
            headerLineIndex++;
        }

        if (headerLineIndex < lines.length && (lines[headerLineIndex].startsWith('**') || lines[headerLineIndex].trim().split(/\s{2,}/).length > 1)) {
            const headerLineText = lines[headerLineIndex].startsWith('**') ? lines[headerLineIndex].replace(/\*\*/g, '') : lines[headerLineIndex];
            const variationTableHeaders = headerLineText.split(/\s{2,}/).map(h => h.trim().toLowerCase()).filter(Boolean);
            
            const variationNameColumnIndex = variationTableHeaders.findIndex(h => h.includes('object') || h.includes('variation') || h.includes('evolution') || h.includes(currentEnemy.name.split(" ")[0].toLowerCase()));
            const statChangesColumnIndex = variationTableHeaders.findIndex(h => h.includes('stat changes') || h.includes('changes from'));

            if (variationNameColumnIndex !== -1 && statChangesColumnIndex !== -1) {
                let dataRowIndex = headerLineIndex + 1;
                while (dataRowIndex < lines.length && lines[dataRowIndex].trim() !== '' && !lines[dataRowIndex].startsWith('#') && !lines[dataRowIndex].startsWith('*')) {
                    const columns = lines[dataRowIndex].trim().split(/\s{2,}/);
                    if (columns.length > Math.max(variationNameColumnIndex, statChangesColumnIndex)) {
                        const variationName = columns[variationNameColumnIndex].trim();
                        const statChangeString = columns[statChangesColumnIndex].trim();
                        if (variationName && statChangeString) {
                            let variation = currentEnemy.variations?.find(v => v.name === variationName);
                            if (!variation) {
                                if (!currentEnemy.variations) currentEnemy.variations = [];
                                variation = { name: variationName, statChanges: [], abilities: [] };
                                currentEnemy.variations.push(variation);
                            }
                            const parsedMods = parseStatModifiers(statChangeString);
                            variation.statChanges = [...(variation.statChanges || []), ...parsedMods];
                        }
                    }
                    dataRowIndex++;
                }
                i = dataRowIndex -1; // Move main index past table
            }
        }
        parsingSection = null; // Reset section after table
        continue;
      }


      // Variation Abilities (usually under H5 but could be H4 if no table)
      const h5VariationAbilityMatch = line.match(/^#####\s+(.*)/);
      const h4VariationAbilityMatch = !h5VariationAbilityMatch && line.match(/^####\s+(.*)/); // Only if not H5
      const variationAbilityHeaderMatch = h5VariationAbilityMatch || h4VariationAbilityMatch;

      if (variationAbilityHeaderMatch) {
        const variationNameFromHeader = variationAbilityHeaderMatch[1].trim().replace(/\*\*/g, '');
        currentVariationNameForAbilities = variationNameFromHeader;
        
        let variation = currentEnemy.variations?.find(v => v.name === currentVariationNameForAbilities);
        if (!variation) {
          if (!currentEnemy.variations) currentEnemy.variations = [];
          variation = { name: currentVariationNameForAbilities, statChanges: [], abilities: [] };
          currentEnemy.variations.push(variation);
        }

        let k = i + 1;
        while(k < lines.length && lines[k].trim() === "") k++; 

        if (k < lines.length && lines[k].trim() === '**Abilities**') {
          parsingSection = 'variationAbilities'; 
          i = k; 
        } else {
          // It's possible this H4/H5 had stats right after it, handle if needed or assume stats from table
          // For now, if no **Abilities**, reset context for this H4/H5
          parsingSection = null; 
          // currentVariationNameForAbilities = null; // Keep if abilities might follow later without **Abilities**
        }
        continue; 
      }


      if (line.startsWith('- CP:')) currentEnemy.cp = parseCp(line);
      else if (line.startsWith('- Template:')) currentEnemy.template = parseTemplate(line);
      else if (parsingSection === 'stats' && line.startsWith('- ')) {
        const statLine = line.substring(2);
        if (statLine.startsWith('HP:')) currentEnemy.baseStats!.hp = parseStatValue(statLine, 'HP');
        else if (statLine.startsWith('MV:')) currentEnemy.baseStats!.mv = parseStatValue(statLine, 'MV');
        else if (statLine.startsWith('Def:')) currentEnemy.baseStats!.def = parseStatValue(statLine, 'Def');
        else if (statLine.startsWith('San:')) currentEnemy.baseStats!.san = parseStatValue(statLine, 'San');
      } else if (parsingSection === 'armor' && line.startsWith('- Effect:')) {
        const effectMatch = line.match(/Effect:\s*(.*)/i);
        if (effectMatch && currentEnemy.baseStats?.armor) {
          currentEnemy.baseStats.armor.effect = effectMatch[1].trim();
        }
        parsingSection = null; 
      } else if (parsingSection === 'attacks' && line.startsWith('- ')) {
        const attackLine = line.substring(2);
        const meleeMatch = attackLine.match(/Melee:\s*(.*)/i);
        const rangeMatch = attackLine.match(/Range:\s*(.*)/i);
        if (meleeMatch) currentEnemy.baseAttacks!.push({ type: 'Melee', details: meleeMatch[1].trim() });
        else if (rangeMatch) currentEnemy.baseAttacks!.push({ type: 'Range', details: rangeMatch[1].trim() });
      } else if (parsingSection === 'abilities' && line.startsWith('- ')) { 
        const abilityLine = line.substring(2).replace(//g, '-');
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*([^–—:]*)/i);
        if (abilityTitleMatch && abilityTitleMatch[1]) {
          currentEnemy.abilities?.push({ 
            name: `${abilityTitleMatch[1].trim()}${abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].trim()}` : ''}`,
            type: abilityTitleMatch[1].trim().split(' ')[0], 
            description: abilityLine 
          });
        }
      } else if (parsingSection === 'variationAbilities' && currentVariationNameForAbilities && line.startsWith('- ')) {
        const abilityLine = line.substring(2).replace(//g, '-');
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*([^–—:]*)/i);
        const variation = currentEnemy.variations?.find(v => v.name === currentVariationNameForAbilities);
        if (variation && abilityTitleMatch && abilityTitleMatch[1]) {
          if (!variation.abilities) variation.abilities = [];
          variation.abilities.push({
            name: `${abilityTitleMatch[1].trim()}${abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].trim()}` : ''}`,
            type: abilityTitleMatch[1].trim().split(' ')[0],
            description: abilityLine
          });
        }
      }
      
      if (line.startsWith('## ') || (line.startsWith('# ') && line.trim() !== lines[0].trim()) || line.startsWith('___')) {
        parsingSection = null;
        currentVariationNameForAbilities = null;
      }
    }
    if (currentEnemy.name) {
      enemies.push(currentEnemy);
    }
  }
  return enemies;
}

