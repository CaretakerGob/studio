
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
    'melee': 'MeleeAttackBonus', 'melee attack': 'MeleeAttackBonus', 'meleeattackbonus': 'MeleeAttackBonus',
    'range': 'RangedAttackBonus', 'range attack': 'RangedAttackBonus', 'rangedattackbonus': 'RangedAttackBonus',
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
      } else {
        // console.warn(`[EnemyParser] Unmapped stat name in modifier: '${rawStatName}' from string '${part}'`);
      }
    } else {
       // console.warn(`[EnemyParser] Could not parse stat modifier part: '${part}'`);
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
      abilities: [], // Initialize base abilities array
      variations: [],
    };

    let parsingSection: 'stats' | 'attacks' | 'logic' | 'abilities' | 'armor' | 'variationTable' | 'variationAbilities' | null = null;
    let currentVariationForAbilities: EnemyVariation | null = null;

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];

      if (line.startsWith('## Base Stats')) { parsingSection = 'stats'; currentVariationForAbilities = null; continue; }
      if (line.startsWith('## Base Attacks')) { parsingSection = 'attacks'; currentVariationForAbilities = null; continue; }
      if (line.startsWith('## Logic:')) {
        parsingSection = 'logic'; currentVariationForAbilities = null;
        const logicMatch = line.match(/Logic:\s*(.*)/i);
        if (logicMatch && logicMatch[1].trim()) { currentEnemy.logic = { condition: logicMatch[1].trim() }; }
        else if (i + 1 < lines.length && lines[i+1] && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('- CP:')) {
            currentEnemy.logic = { condition: lines[i+1].trim() }; i++;
        }
        continue;
      }
      if (line.startsWith('## Abilities:')) { parsingSection = 'abilities'; currentVariationForAbilities = null; continue; }
      
      if (line.startsWith('### Armor:')) {
        parsingSection = 'armor'; currentVariationForAbilities = null;
        const armorNameMatch = line.match(/Armor:\s*(.*)/i);
        if (armorNameMatch && currentEnemy.baseStats) {
          currentEnemy.baseStats.armor = { name: armorNameMatch[1].trim(), effect: '' };
        }
        continue;
      }
      
      if (line.startsWith('* ') && line.endsWith(' Table') && !line.includes("Resurrection Table")) {
        parsingSection = 'variationTable';
        // Skip typical table header lines
        let k = i + 1;
        while (k < lines.length && (lines[k].trim() === '' || lines[k].trim().toLowerCase().includes('stat changes over base') || lines[k].trim().toLowerCase().startsWith('**object'))) {
          k++;
        }
        i = k - 1; // Position i before the first actual variation data line
        continue;
      }

      if (parsingSection === 'variationTable') {
        if (line.startsWith('#### ')) {
            const variationName = line.substring(5).trim();
            let statLineIndex = i + 1;
            while (statLineIndex < lines.length && lines[statLineIndex].trim() === '') {
                statLineIndex++; // Skip blank lines
            }

            if (statLineIndex < lines.length && lines[statLineIndex].trim() && !lines[statLineIndex].startsWith('#') && !lines[statLineIndex].startsWith('*')) {
                const statChangeString = lines[statLineIndex].trim();
                let variation = currentEnemy.variations?.find(v => v.name === variationName);
                if (!variation) {
                    if (!currentEnemy.variations) currentEnemy.variations = [];
                    variation = { name: variationName, statChanges: [], abilities: [] };
                    currentEnemy.variations.push(variation);
                }
                const parsedMods = parseStatModifiers(statChangeString);
                variation.statChanges = [...(variation.statChanges || []), ...parsedMods];
                i = statLineIndex; // Advance main loop index past the stat line
            }
        } else if (line.trim() !== '' && !line.startsWith('####')) {
            // If it's not a '####' and not blank, assume end of this specific table's variation definitions
            parsingSection = null; 
            i--; // Re-evaluate this line with general logic as it might be start of abilities
        }
        continue; 
      }
      
      const variationAbilityHeadingMatch = line.match(/^(?:#####?)\s+(.*)/); // H4 or H5 for variation abilities block
      if (variationAbilityHeadingMatch) {
          const variationNameFromHeading = variationAbilityHeadingMatch[1].trim().replace(/\*\*/g, '');
          currentVariationForAbilities = currentEnemy.variations?.find(v => v.name === variationNameFromHeading) || null;
          if (currentVariationForAbilities) {
              parsingSection = 'variationAbilities';
              // Check for **Abilities** keyword immediately following
              let k = i + 1;
              while (k < lines.length && lines[k].trim() === "") k++; // Skip blank lines
              if (k < lines.length && lines[k].trim().toLowerCase() === '**abilities**') {
                  i = k; // Move index past "**Abilities**" line
              }
          } else {
              // It might be a general abilities sub-header not tied to a table-defined variation
              // console.warn(`[Parser] Found ability heading "${line}" but no matching variation "${variationNameFromHeading}" from table. Treating as general ability section if applicable.`);
              parsingSection = 'abilities'; // Fallback to general abilities if variation not found
              currentVariationForAbilities = null;
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
        const abilityLine = line.substring(2).replace(/\uFFFD/g, ' ');
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*([^–—:]*)/i);
        if (abilityTitleMatch && abilityTitleMatch[1]) {
          currentEnemy.abilities?.push({ 
            name: `${abilityTitleMatch[1].trim()}${abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].trim()}` : ''}`,
            type: abilityTitleMatch[1].trim().split(' ')[0], 
            description: abilityLine 
          });
        }
      } else if (parsingSection === 'variationAbilities' && currentVariationForAbilities && line.startsWith('- ')) {
        const abilityLine = line.substring(2).replace(/\uFFFD/g, ' ');
        const abilityTitleMatch = abilityLine.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*([^–—:]*)/i);
        if (abilityTitleMatch && abilityTitleMatch[1]) {
          if (!currentVariationForAbilities.abilities) currentVariationForAbilities.abilities = [];
          currentVariationForAbilities.abilities.push({
            name: `${abilityTitleMatch[1].trim()}${abilityTitleMatch[2] ? `: ${abilityTitleMatch[2].trim()}` : ''}`,
            type: abilityTitleMatch[1].trim().split(' ')[0],
            description: abilityLine
          });
        }
      }
      
      if (line.startsWith('## ') || line.startsWith('___') || (line.startsWith('# ') && line.trim() !== lines[0].trim()) ) {
        parsingSection = null;
        currentVariationForAbilities = null;
      }
    }
    if (currentEnemy.name) {
      enemies.push(currentEnemy);
    }
  }
  return enemies;
}

