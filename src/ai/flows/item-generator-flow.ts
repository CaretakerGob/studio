
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
  rarity: z.enum(["Common", "Uncommon", "Rare", "Artifact"]).optional()
    .describe('The desired rarity of the item (e.g., Common, Uncommon, Rare, Artifact).'),
  statFocus: z.string().optional()
    .describe('An optional focus for the item\'s stats or primary effect (e.g., "Prioritize HP bonus", "High fire damage", "Grants stealth").'),
});
export type ItemGeneratorInput = z.infer<typeof ItemGeneratorInputSchema>;

const ItemGeneratorOutputSchema = z.object({
  itemName: z.string().describe('The unique and evocative name of the generated item.'),
  itemTypeGenerated: z.string().describe('The specific category of item that was generated (e.g., Gear, Melee Weapon, Augment). This should align with the requested itemType.'),
  description: z.string().describe('A 2-3 sentence lore description connecting the item to the world’s supernatural elements or conspiracies in a current day dark horror setting.'),
  gameEffect: z.string().describe('The mechanical effect of the item in the game. This should include Stats/Effects (e.g., Damage value, Range, Special abilities, Cooldowns, Status effects applied), Element Type (if applicable: Physical, Fire, Ice, Electricity, Ether, Nether), Cooldown (if applicable), and Usage Type (Action, Interrupt, Passive, Free Action).'),
  rarityGenerated: z.string().optional().describe('The rarity of the item that was generated.'),
});
export type ItemGeneratorOutput = z.infer<typeof ItemGeneratorOutputSchema>;

export async function generateGameItem(input: ItemGeneratorInput): Promise<ItemGeneratorOutput> {
  return itemGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameItemPrompt',
  input: { schema: ItemGeneratorInputSchema },
  output: { schema: ItemGeneratorOutputSchema },
  prompt: `You are an expert game designer for a tabletop game called "Riddle of the Beast," which has a dark, current-day horror-fantasy setting involving supernatural elements and conspiracies.
Your task is to generate a unique in-world item based on the following specifications.

Item Category: {{{itemType}}}

{{#if theme}}
Incorporate the theme: '{{{theme}}}'.
{{/if}}

{{#if rarity}}
The item should have a rarity level of: {{{rarity}}}.
{{/if}}

{{#if statFocus}}
The item's stats or primary effect should be influenced by the following focus: '{{{statFocus}}}'.
{{/if}}

The output for the item must include:
1.  Item Name: [A unique and evocative name for the item]
2.  Category Generated: [Should be '{{{itemType}}}' or a more specific sub-type that fits within '{{{itemType}}}']
3.  Lore Description: [2-3 sentences connecting the item to the world’s supernatural elements, conspiracies, or its grim origins in a modern horror context.]
4.  Game Effect: [Detail all mechanical effects. Include:
    - Stats/Effects: e.g., Damage value (like A2, A3/R4), specific stat bonuses (+1 DEF, -1 Sanity), special abilities, cooldowns (e.g., "2 round CD", "Once per battle"), status effects applied (e.g., POISON, BLEED, MARKED).
    - Element Type: If applicable (Physical, Fire, Ice, Electricity, Ether, Nether).
    - Cooldown: If the item or an ability it grants has a cooldown.
    - Usage Type: If the item itself or an ability it grants is an Action, Interrupt, Passive, or FREE Action.]
5.  Rarity Generated: [The rarity of the item, should align with requested rarity if provided, otherwise choose an appropriate one: Common, Uncommon, Rare, Artifact]

Example tone for items: gritty, cryptic, mysterious—like something scavenged from a black market run by occultists, found in a decaying urban ruin, or reverse-engineered from cursed modern technology. Ensure the item feels like it belongs in a world where ordinary people confront terrifying, often incomprehensible, threats.
Keep game balance in mind for a challenging horror board game experience. Artifacts should be powerful but might come with a significant drawback or be very hard to acquire. Common items should be generally useful but not game-breaking.
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
    // Ensure the output structure matches, especially if the LLM deviates.
    // The schema definition in the prompt helps, but this is a fallback.
    return {
        itemName: output.itemName || "Unnamed Item",
        itemTypeGenerated: output.itemTypeGenerated || input.itemType,
        description: output.description || "No description provided.",
        gameEffect: output.gameEffect || "No game effect specified.",
        rarityGenerated: output.rarityGenerated || input.rarity || "Common",
    };
  }
);

