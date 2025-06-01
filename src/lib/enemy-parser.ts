
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
    'attack': 'MeleeAttackBonus', // Default "Attack" to Melee if not specified further
    'attacks': 'MeleeAttackBonus',
  };

  parts.forEach(part => {
    // Regex to capture operator (+/-), value (digits), and stat name (words, possibly with spaces)
    const match = part.match(/^([+-])?\s*(\d+)\s+([a-zA-Z\s]+)/i);
    if (match) {
      const operator = match[1] || '+'; // Default to '+' if no operator
      const value = parseInt(match[2], 10);
      const rawStatName = match[3].trim().toLowerCase();
      
      const mappedStatName = statNameMap[rawStatName];

      if (mappedStatName) {
        modifiers.push({
          stat: mappedStatName,
          value: operator === '+' ? value : -value,
        });
      } else if (rawStatName.startsWith("regen") && rawStatName.endsWith("hp")) {
        // console.log(`[EnemyParser] Encountered Regen HP: "${part}", not directly parsed as StatModifier for now.`);
      } else {
        // console.warn(`[EnemyParser] Unmapped stat modifier name: "${rawStatName}" in string "${part}" from "${changeStr}"`);
      }
    } else {
        // console.warn(`[EnemyParser] Could not parse stat modifier part: "${part}" from string "${changeStr}"`);
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

    let parsingSection: 'stats' | 'attacks' | 'logic' | 'abilities' | 'armor' | 'variationTable' | 'variationAbilities' | null = null;
    let variationTableHeaders: string[] = [];
    let variationNameColumnIndex = -1;
    let statChangesColumnIndex = -1;
    let currentVariationNameForAbilities: string | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## Base Stats')) { parsingSection = 'stats'; currentVariationNameForAbilities = null; continue; }
      if (line.startsWith('## Base Attacks')) { parsingSection = 'attacks'; currentVariationNameForAbilities = null; continue; }
      if (line.startsWith('## Logic:')) {
        parsingSection = 'logic'; currentVariationNameForAbilities = null;
        const logicMatch = line.match(/Logic:\s*(.*)/i);
        if (logicMatch && logicMatch[1].trim()) { currentEnemy.logic = { condition: logicMatch[1].trim() }; }
        else if (lines[i+1] && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('- CP:')) {
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
      
      const variationTitleMatch = line.match(/^####\s+(.*)/);
      if (variationTitleMatch) {
        const variationName = variationTitleMatch[1].trim();
        currentVariationNameForAbilities = variationName; // Set context for potential abilities later

        let variation = currentEnemy.variations?.find(v => v.name === variationName);
        if (!variation) {
          if (!currentEnemy.variations) currentEnemy.variations = [];
          variation = { name: variationName, statChanges: [], abilities: [] };
          currentEnemy.variations.push(variation);
        }
        
        // Check next line for stat modifiers directly
        if (i + 1 < lines.length) {
          const nextLineContent = lines[i+1].trim();
          // Check if nextLine is a stat modifier string and not an ability section or another heading
          if (nextLineContent && !nextLineContent.startsWith('**Abilities**') && !nextLineContent.startsWith('#') && !nextLineContent.startsWith('* ') && nextLineContent.match(/^([+-]\d+\s+\w+)/) ) {
            const parsedMods = parseStatModifiers(nextLineContent);
            if (parsedMods.length > 0) {
              variation.statChanges = [...(variation.statChanges || []), ...parsedMods];
            }
            i++; // Consume the stat modifier line
          }
        }

        // Check for abilities section (might be on the line after stat mods or directly after variation name)
        if (i + 1 < lines.length && lines[i+1].trim() === '**Abilities**') {
          parsingSection = 'variationAbilities'; // This state will be used by the next iteration of the loop for abilities under this variation
          i++; // Consume the "**Abilities**" line
        } else {
          // If no **Abilities** found immediately after, reset parsing section
          // to prevent misinterpreting subsequent lines as abilities for this variation
          parsingSection = null; 
        }
        continue; // Continue to next line after processing #### block
      }

      // This parses the table (like Tenebrae Resurrection Table)
      // Ensure it doesn't conflict with the #### parsing for Animated Objects
      if (line.match(/^\*\s.*Table$/i) && !line.includes("Animated Objects Table")) {
        parsingSection = 'variationTable'; currentVariationNameForAbilities = null;
        variationTableHeaders = []; variationNameColumnIndex = -1; statChangesColumnIndex = -1;
        if (lines[i+1] && (lines[i+1].startsWith('**') || lines[i+1].trim().split(/\s{2,}/).length > 1) ) {
          const headerLine = lines[i+1].startsWith('**') ? lines[i+1].replace(/\*\*/g, '') : lines[i+1];
          variationTableHeaders = headerLine.split(/\s{2,}/).map(h => h.trim().toLowerCase()).filter(Boolean);
          
          variationNameColumnIndex = variationTableHeaders.findIndex(h => h.includes('object') || h.includes('variation') || h.includes(name.split(' ')[0].toLowerCase()) || h.includes('enemy') || h.includes('insect') || h.includes('maniac') || h.includes('plant') || h.includes('evolution'));
          statChangesColumnIndex = variationTableHeaders.findIndex(h => h.includes('stat changes') || h.includes('changes over base') || h.includes('stat mods'));
          i++; 
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
      } else if (parsingSection === 'abilities' && line.startsWith('- ')) { // Base enemy abilities
        const abilityLine = line.substring(2);
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*(.*)/i);
        if (abilityTitleMatch && abilityTitleMatch[1]) {
          currentEnemy.abilities?.push({ 
            name: abilityTitleMatch[1].trim() + (abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].split('–')[0].trim()}` : ''),
            type: abilityTitleMatch[1].trim().split(' ')[0], 
            description: abilityLine 
          });
        }
      } else if (parsingSection === 'variationAbilities' && currentVariationNameForAbilities && line.startsWith('- ')) { // Variation-specific abilities
        const abilityLine = line.substring(2);
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*(.*)/i);
        if (abilityTitleMatch && abilityTitleMatch[1]) {
          const variation = currentEnemy.variations?.find(v => v.name === currentVariationNameForAbilities);
          if (variation) {
            if (!variation.abilities) variation.abilities = [];
            variation.abilities.push({
              name: abilityTitleMatch[1].trim() + (abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].split('–')[0].trim()}` : ''),
              type: abilityTitleMatch[1].trim().split(' ')[0],
              description: abilityLine
            });
          }
        }
      } else if (parsingSection === 'variationTable' && line.startsWith('- ') && variationNameColumnIndex !== -1 && statChangesColumnIndex !== -1) {
        const columns = line.substring(2).split(/\s{2,}/); 
        if (columns.length > Math.max(variationNameColumnIndex, statChangesColumnIndex)) {
          const variationName = columns[variationNameColumnIndex].trim();
          const statChangeString = columns[statChangesColumnIndex].trim();
          if (variationName && statChangeString) {
             // Ensure variations array exists
            if (!currentEnemy.variations) {
                currentEnemy.variations = [];
            }
            // Check if variation already exists (e.g., from a #### block)
            let variation = currentEnemy.variations.find(v => v.name === variationName);
            if (!variation) {
                variation = { name: variationName, statChanges: [], abilities: [] };
                currentEnemy.variations.push(variation);
            }
            const parsedMods = parseStatModifiers(statChangeString);
            variation.statChanges = [...(variation.statChanges || []), ...parsedMods];
          }
        }
      }
    }
    if (currentEnemy.name) {
      enemies.push(currentEnemy);
    }
  }
  return enemies;
}

