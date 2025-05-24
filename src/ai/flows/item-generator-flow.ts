
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
  itemType: z.enum(['Gear', 'Melee Weapon', 'Ranged Weapon', 'Augment', 'Utility', 'Consumable'])
    .describe('The general category of item to generate (e.g., Gear, Melee Weapon, Consumable).'),
  theme: z.string().optional()
    .describe('An optional theme or keyword to influence the item generation (e.g., cursed, ancient, elemental).'),
});
export type ItemGeneratorInput = z.infer<typeof ItemGeneratorInputSchema>;

const ItemGeneratorOutputSchema = z.object({
  itemName: z.string().describe('The unique and evocative name of the generated item.'),
  itemTypeGenerated: z.string().describe('The specific category of item that was generated (e.g., Gear, Melee Weapon, Augment). This should align with the requested itemType.'),
  description: z.string().describe('A 2-3 sentence lore description connecting the item to the world’s supernatural elements or conspiracies.'),
  gameEffect: z.string().describe('The mechanical effect of the item in the game. This should include Stats/Effects (e.g., Damage value, Range, Special abilities, Cooldowns, Status effects applied), Element Type (if applicable: Physical, Fire, Ice, Electricity, Ether, Nether), Cooldown (if applicable), and Usage Type (Action, Interrupt, Passive, Free Action).'),
});
export type ItemGeneratorOutput = z.infer<typeof ItemGeneratorOutputSchema>;

export async function generateGameItem(input: ItemGeneratorInput): Promise<ItemGeneratorOutput> {
  return itemGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameItemPrompt',
  input: { schema: ItemGeneratorInputSchema },
  output: { schema: ItemGeneratorOutputSchema },
  prompt: `Generate a unique in-world item for the tabletop game Riddle of the Beast.
The item must match the dark, modern horror-fantasy setting and fit the category: {{{itemType}}}.
{{#if theme}}
The item should also incorporate the theme: '{{{theme}}}'.
{{/if}}

The item should include:

Item Name: [Generated Item Name]
Category: [Should be '{{{itemType}}}' or a more specific sub-type that fits within '{{{itemType}}}']
Lore Description: [2-3 sentences connecting it to the world’s supernatural elements or conspiracies]
Stats/Effects: [e.g., Damage value, Range, Special abilities, Cooldowns, Status effects applied. Include Element Type (if applicable: Physical, Fire, Ice, Electricity, Ether, Nether), Cooldown (if applicable), and Usage Type (Action, Interrupt, Passive, Free Action) here.]

Example tone: gritty, cryptic, mysterious—like something scavenged from a black market run by occultists or reverse-engineered from cursed tech.
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

