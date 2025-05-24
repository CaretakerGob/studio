
'use server';
/**
 * @fileOverview An AI-powered item generator for the Riddle of the Beast game.
 *
 * - generateGameItem - A function that generates a game item based on type and theme.
 * - ItemGeneratorInput - The input type for the generateGameItem function.
 * - ItemGeneratorOutput - The return type for the generateGameItem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ItemGeneratorInputSchema = z.object({
  itemType: z.enum(['weapon', 'armor', 'trinket', 'potion', 'scroll'])
    .describe('The general type of item to generate (e.g., weapon, armor, trinket).'),
  theme: z.string().optional()
    .describe('An optional theme or keyword to influence the item generation (e.g., cursed, ancient, elemental).'),
});
export type ItemGeneratorInput = z.infer<typeof ItemGeneratorInputSchema>;

const ItemGeneratorOutputSchema = z.object({
  itemName: z.string().describe('The unique and evocative name of the generated item.'),
  itemTypeGenerated: z.string().describe('The specific type of item that was generated (e.g., Sword, Shield, Ring). This should align with the requested itemType.'),
  description: z.string().describe('A detailed and thematic description of the item, including its appearance and lore.'),
  gameEffect: z.string().describe('The mechanical effect of the item in the game (e.g., "+2 Attack", "Grants fire resistance", "Once per game: heal 1d6 HP"). Be specific and balanced for a dark fantasy board game.'),
});
export type ItemGeneratorOutput = z.infer<typeof ItemGeneratorOutputSchema>;

export async function generateGameItem(input: ItemGeneratorInput): Promise<ItemGeneratorOutput> {
  return itemGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameItemPrompt',
  input: { schema: ItemGeneratorInputSchema },
  output: { schema: ItemGeneratorOutputSchema },
  prompt: `You are an expert game designer creating items for a dark fantasy board game called 'Riddle of the Beast'.
The game is challenging and has a gritty, horror-esque atmosphere. Items should reflect this.

Generate a unique {{{itemType}}}.
{{#if theme}}
The item should strongly incorporate the theme: '{{{theme}}}'. For example, if the theme is 'cursed', consider adding a drawback or a dark twist to its benefits.
{{/if}}

Follow these guidelines for generation:

1.  **Item Name**:
    *   Evocative and unique (e.g., "Whispering Shard", "Gravewarden's Helm", "Blighted Charm").
    *   Avoid generic names like "Magic Sword".

2.  **Item Type Generated**:
    *   Be specific. If itemType was 'weapon', this could be 'Cursed Dagger', 'Heavy Crossbow', 'Runed Mace', 'Warped Staff'.
    *   If itemType was 'armor', this could be 'Plated Mail', 'Shadowy Cloak', 'Bone Cuirass'.
    *   If itemType was 'trinket', this could be 'Faded Locket', 'Eye of the Seer', 'Warding Totem'.

3.  **Description**:
    *   Focus on dark fantasy aesthetics: describe its appearance, materials, potential ominous history, or unsettling feel.
    *   Hint at its power or danger.
    *   Example: "A jagged dagger seemingly carved from obsidian, it hums with a faint, unsettling energy and feels unnaturally cold to the touch. Legends say it was used in forgotten rituals."

4.  **Game Effect**:
    *   **Balance is Key:** Effects should be useful but not game-breaking for a challenging board game.
    *   **Clarity:** Clearly state the mechanical effect.
    *   **Weapons:**
        *   Attack bonuses typically range from +1 to +3.
        *   May add elemental damage (e.g., FIRE, ICE, NETHER, ETHER) or status effects (e.g., BLEED, POISON, PARALYZE).
        *   Example: "+1 Attack. On a critical hit, target suffers 1 BLEED damage for 2 rounds." or "Deals 1d3 ETHER damage."
    *   **Armor:**
        *   Defense bonuses typically range from +1 to +2.
        *   May grant resistance to a specific damage type or minor protection against status effects.
        *   Example: "+1 Defense. Gain resistance to FIRE damage."
    *   **Trinkets:**
        *   Often provide passive bonuses or limited-use abilities.
        *   Could be skill check bonuses (e.g., "+1 to Occult skill checks").
        *   Could be once-per-game or once-per-investigation abilities (e.g., "Once per investigation: reroll a failed Sanity check.").
        *   Example: "Once per game, after failing a Sanity check, you may choose to succeed instead but take 1 HP damage."
    *   **Potions:**
        *   Usually consumable with immediate effects.
        *   Example: "Heals 1d6+1 HP." or "Grants Stealth for 1 turn."
    *   **Scrolls:**
        *   Often consumable, single-use spells or effects.
        *   Example: "Deals 2 ETHER damage to a target within 3 spaces." or "Summons a 1 HP Wisp for one combat."

Ensure the generated item fits the dark, challenging, and horror-esque theme of 'Riddle of the Beast'.
`,
});

const itemGeneratorFlow = ai.defineFlow(
  {
    name: 'itemGeneratorFlow',
    inputSchema: ItemGeneratorInputSchema,
    outputSchema: ItemGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate item from LLM.');
    }
    return output;
  }
);

