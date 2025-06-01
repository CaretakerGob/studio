
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
    'san': 'San', 'sanity': 'San', 'max san': 'MaxSanity',
    'melee': 'MeleeAttackBonus', 'melee attack': 'MeleeAttackBonus',
    'range': 'RangedAttackBonus', 'range attack': 'RangedAttackBonus', // Assuming "Range" might mean Ranged Attack Bonus
    // Add more mappings if needed, e.g., for specific elemental damage bonuses if they appear
  };

  parts.forEach(part => {
    const match = part.match(/([+-])\s*(\d+)\s+(.*)/i);
    if (match) {
      const operator = match[1];
      const value = parseInt(match[2], 10);
      const rawStatName = match[3].trim().toLowerCase();
      
      const mappedStatName = statNameMap[rawStatName];

      if (mappedStatName) {
        modifiers.push({
          stat: mappedStatName,
          value: operator === '+' ? value : -value,
        });
      } else {
        console.warn(`[EnemyParser] Unmapped stat modifier name: "${rawStatName}" in string "${part}"`);
      }
    } else {
        // Try to parse simple stat name changes without explicit +/- (e.g. "Two Actions per round")
        // This part is more heuristic and might need refinement based on actual rulebook data
        if (part.toLowerCase().includes("actions per round")) {
            // This is more of an ability/trait than a direct stat mod, handle as needed or ignore for StatModifier
            // console.log(`[EnemyParser] Encountered action count modifier: "${part}", currently not parsed as StatModifier.`);
        } else {
            // console.warn(`[EnemyParser] Could not parse stat modifier part: "${part}" from string "${changeStr}"`);
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

    let parsingSection: 'stats' | 'attacks' | 'logic' | 'abilities' | 'armor' | 'variationTable' | null = null;
    let variationTableHeaders: string[] = [];
    let variationNameColumnIndex = -1;
    let statChangesColumnIndex = -1;
    let inVariationBlock = false; // Flag specifically for when we are inside a variation definition block (e.g. Lurch Abilities)

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## Base Stats')) { parsingSection = 'stats'; inVariationBlock = false; continue; }
      if (line.startsWith('## Base Attacks')) { parsingSection = 'attacks'; inVariationBlock = false; continue; }
      if (line.startsWith('## Logic:')) {
        parsingSection = 'logic'; inVariationBlock = false;
        const logicMatch = line.match(/Logic:\s*(.*)/i);
        if (logicMatch && logicMatch[1].trim()) { currentEnemy.logic = { condition: logicMatch[1].trim() }; }
        else if (lines[i+1] && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('- CP:')) {
            currentEnemy.logic = { condition: lines[i+1].trim() }; i++;
        }
        continue;
      }
      if (line.startsWith('## Abilities:')) { parsingSection = 'abilities'; inVariationBlock = false; continue; }
      if (line.startsWith('### Armor:')) {
        parsingSection = 'armor'; inVariationBlock = false;
        const armorNameMatch = line.match(/Armor:\s*(.*)/i);
        if (armorNameMatch && currentEnemy.baseStats) {
          currentEnemy.baseStats.armor = { name: armorNameMatch[1].trim(), effect: '' };
        }
        continue;
      }
      // Detect start of a variation table
      if (line.match(/^\*\s.*Table$/i)) {
        parsingSection = 'variationTable';
        inVariationBlock = false; // Not parsing specific variation abilities yet, just the table
        variationTableHeaders = [];
        variationNameColumnIndex = -1;
        statChangesColumnIndex = -1;
        // Next line should be headers
        if (lines[i+1] && lines[i+1].startsWith('**')) {
          variationTableHeaders = lines[i+1].split('**').map(h => h.trim().toLowerCase()).filter(Boolean);
          variationNameColumnIndex = variationTableHeaders.findIndex(h => h.includes('object') || h.includes('variation') || h.includes(name.split(' ')[0].toLowerCase())); // Heuristic
          statChangesColumnIndex = variationTableHeaders.findIndex(h => h.includes('stat changes') || h.includes('changes over base'));
          i++; // Consumed header line
        }
        continue;
      }

      // Detect start of a block defining abilities for a specific variation (e.g., "Lurch Abilities")
      if (line.match(/^[A-Za-z\s]+ Abilities$/i) && !line.startsWith('#')) {
         inVariationBlock = true;
         // The name of the variation block (e.g., "Lurch") could be extracted here if needed later
         // For now, this flag just helps avoid misinterpreting ability lines as main enemy abilities
         parsingSection = 'abilities'; // Treat as ability parsing context
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
        parsingSection = null; // End of armor section
      } else if (parsingSection === 'attacks' && line.startsWith('- ')) {
        const attackLine = line.substring(2);
        const meleeMatch = attackLine.match(/Melee:\s*(.*)/i);
        const rangeMatch = attackLine.match(/Range:\s*(.*)/i);
        if (meleeMatch) currentEnemy.baseAttacks!.push({ type: 'Melee', details: meleeMatch[1].trim() });
        else if (rangeMatch) currentEnemy.baseAttacks!.push({ type: 'Range', details: rangeMatch[1].trim() });
      } else if (parsingSection === 'abilities' && !inVariationBlock && (line.startsWith('Special') || line.startsWith('Signature') || line.startsWith('Passive'))) {
        const abilityTitleMatch = line.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*(.*)/i);
        if(abilityTitleMatch && abilityTitleMatch[1]){
           currentEnemy.abilities?.push({ name: abilityTitleMatch[1].trim(), type: abilityTitleMatch[1].trim().split(' ')[0], description: line });
        }
      } else if (parsingSection === 'variationTable' && line.startsWith('- ') && variationNameColumnIndex !== -1 && statChangesColumnIndex !== -1) {
        // Attempt to parse variation row
        const columns = line.substring(2).split(/\s{2,}/); // Split by 2+ spaces, very basic
        if (columns.length > Math.max(variationNameColumnIndex, statChangesColumnIndex)) {
          const variationName = columns[variationNameColumnIndex].trim();
          const statChangeString = columns[statChangesColumnIndex].trim();
          if (variationName && statChangeString) {
            currentEnemy.variations!.push({
              name: variationName,
              statChanges: parseStatModifiers(statChangeString),
            });
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
