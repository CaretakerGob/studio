
import type { Enemy, EnemyStatBlock, EnemyAttack, EnemyArmor, EnemyLogic } from '@/types/mission';
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
  const regex = new RegExp(`${statName}:\\s*(\\d+)`, 'i');
  const match = line.match(regex);
  return match ? parseInt(match[1], 10) : undefined;
}

export async function parseHorrorJournal(): Promise<Enemy[]> {
  const filePath = path.join(process.cwd(), 'Horror Journal Rulebook.md');
  let fileContent: string;
  try {
    fileContent = await fs.promises.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error("Error reading Horror Journal Rulebook.md:", error);
    return [];
  }

  const enemies: Enemy[] = [];
  const enemyBlocks = fileContent.split(/\n(?=#\s)/); // Split by lines starting with '# '

  for (const block of enemyBlocks) {
    const lines = block.split('\n').map(line => line.trim());
    if (lines.length === 0 || !lines[0].startsWith('# ')) continue;

    const name = lines[0].substring(2).trim();
    if (!name) continue;

    let currentEnemy: Partial<Enemy> = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      baseStats: {},
      baseAttacks: [],
      logic: undefined,
      abilities: [],
    };

    let parsingSection: 'stats' | 'attacks' | 'logic' | 'abilities' | 'armor' | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## Base Stats')) {
        parsingSection = 'stats';
        continue;
      } else if (line.startsWith('## Base Attacks')) {
        parsingSection = 'attacks';
        continue;
      } else if (line.startsWith('## Logic:')) {
        parsingSection = 'logic';
        // Logic rule is often on the same line or next
        const logicMatch = line.match(/Logic:\s*(.*)/i);
        if (logicMatch && logicMatch[1].trim()) {
          currentEnemy.logic = { condition: logicMatch[1].trim() };
        } else if (lines[i+1] && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('- CP:')) { // check if next line is part of logic
            currentEnemy.logic = { condition: lines[i+1].trim() };
            i++; // consume next line
        }
        continue;
      } else if (line.startsWith('## Abilities:')) { // Placeholder for more complex ability parsing
        parsingSection = 'abilities';
        continue;
      } else if (line.startsWith('### Armor:')) {
        parsingSection = 'armor';
        const armorNameMatch = line.match(/Armor:\s*(.*)/i);
        if (armorNameMatch && currentEnemy.baseStats) {
          currentEnemy.baseStats.armor = { name: armorNameMatch[1].trim(), effect: '' };
        }
        continue;
      }

      if (line.startsWith('- CP:')) {
        currentEnemy.cp = parseCp(line);
      } else if (line.startsWith('- Template:')) {
        currentEnemy.template = parseTemplate(line);
      } else if (parsingSection === 'stats' && line.startsWith('- ')) {
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
        parsingSection = 'stats'; // Assume armor effect is the last part of armor section
      } else if (parsingSection === 'attacks' && line.startsWith('- ')) {
        const attackLine = line.substring(2);
        const meleeMatch = attackLine.match(/Melee:\s*(.*)/i);
        const rangeMatch = attackLine.match(/Range:\s*(.*)/i);
        if (meleeMatch) {
          currentEnemy.baseAttacks!.push({ type: 'Melee', details: meleeMatch[1].trim() });
        } else if (rangeMatch) {
          currentEnemy.baseAttacks!.push({ type: 'Range', details: rangeMatch[1].trim() });
        }
      } else if (parsingSection === 'abilities' && line.startsWith('Special') || line.startsWith('Signature') || line.startsWith('Passive')) {
        // Basic ability title capture, detailed description parsing is complex
        const abilityTitleMatch = line.match(/^(Special \d+|Signature|Passive(?: \d+)?)\s*[-–—:]?\s*(.*)/i);
        if(abilityTitleMatch && abilityTitleMatch[1]){
          // For now, just storing the line. Proper parsing of multi-line descriptions would be needed.
           currentEnemy.abilities?.push({ name: abilityTitleMatch[1].trim(), type: abilityTitleMatch[1].trim().split(' ')[0], description: line });
        }
      }
    }
    if (currentEnemy.name) {
         enemies.push(currentEnemy as Enemy);
    }
  }
  return enemies;
}
