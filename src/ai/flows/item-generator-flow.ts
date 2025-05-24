
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

export const ItemGeneratorInputSchema = z.object({
  itemType: z.enum(['weapon', 'armor', 'trinket', 'potion', 'scroll'])
    .describe('The general type of item to generate (e.g., weapon, armor, trinket).'),
  theme: z.string().optional()
    .describe('An optional theme or keyword to influence the item generation (e.g., cursed, ancient, elemental).'),
});
export type ItemGeneratorInput = z.infer<typeof ItemGeneratorInputSchema>;

export const ItemGeneratorOutputSchema = z.object({
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
The game is challenging and has a gritty, horror-esque atmosphere.

Generate a unique {{{itemType}}}.
{{#if theme}}
The item should strongly incorporate the theme: '{{{theme}}}'.
{{/if}}

Provide the following details for the item:
1.  **Item Name**: A unique and evocative name.
2.  **Item Type Generated**: The specific kind of item (e.g., if itemType was 'weapon', this could be 'Cursed Dagger', 'Heavy Crossbow', 'Runed Mace').
3.  **Description**: A detailed and thematic description of the item, focusing on its appearance, feel, and any subtle hints to its nature or origin.
4.  **Game Effect**: Clearly state its mechanical effect in the game. Examples:
    *   Weapon: "+2 Attack", "On critical hit: target bleeds for 1 HP per round for 2 rounds."
    *   Armor: "+1 Defense", "Grants resistance to Nether damage."
    *   Trinket: "Once per investigation: reroll a failed Sanity check.", "+1 to Occult skill checks."
    *   Potion: "Heals 2 HP.", "Grants Stealth for 1 turn."
    *   Scroll: "Deals 2 ETHER damage to a target within 3 spaces.", "Summons a 1 HP Wisp."

Ensure the game effect is balanced for a challenging board game. Avoid overly complex or overly powerful effects unless the theme (e.g., 'legendary artifact') implies it.
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
