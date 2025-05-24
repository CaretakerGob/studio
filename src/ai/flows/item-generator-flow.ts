
'use server';
/**
 * @fileOverview An AI-powered item generator for the Riddle of the Beast game.
 * This flow generates game items based on user-specified type, theme, rarity,
 * and stat focus, adhering to the game's rules and dark modern horror setting.
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
    .describe('An optional theme or keyword to influence the item generation (e.g., cursed, ancient, elemental, makeshift, occult tech).'),
  rarity: z.enum(["Common", "Uncommon", "Rare", "Artifact"]).optional()
    .describe('The desired rarity of the item (e.g., Common, Uncommon, Rare, Artifact).'),
  statFocus: z.string().optional()
    .describe('An optional focus for the item\'s stats or primary effect (e.g., "Prioritize HP bonus", "High fire damage", "Grants stealth", "Causes FEAR status").'),
});
export type ItemGeneratorInput = z.infer<typeof ItemGeneratorInputSchema>;

const ItemGeneratorOutputSchema = z.object({
  itemName: z.string().describe('The unique and evocative name of the generated item.'),
  itemTypeGenerated: z.string().describe('The specific category of item that was generated (e.g., Gear, Melee Weapon, Augment). This should align with the requested itemType.'),
  description: z.string().describe('A 2-3 sentence lore description connecting the item to the world’s supernatural elements, conspiracies, or its grim origins in a current day dark horror setting.'),
  gameEffect: z.string().describe('The mechanical effect of the item in the game. This should include: Stats/Effects (e.g., "Attack: A2", "Attack: A3/R4", "+1 Max HP", "Reroll one defense dice"), Element Type (if applicable: Physical, Fire, Ice, Electricity, Ether, Nether), Cooldown (e.g., "2 round CD", "Once per battle"), Charges (e.g. "3 Charges, "Consumed after use"), and Usage Type (Action, Interrupt, Passive, Free Action).'),
  rarityGenerated: z.string().optional().describe('The rarity of the item that was generated (Common, Uncommon, Rare, Artifact).'),
});
export type ItemGeneratorOutput = z.infer<typeof ItemGeneratorOutputSchema>;

export async function generateGameItem(input: ItemGeneratorInput): Promise<ItemGeneratorOutput> {
  return itemGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameItemPrompt',
  input: { schema: ItemGeneratorInputSchema },
  output: { schema: ItemGeneratorOutputSchema },
  prompt: `You are an expert game designer for a tabletop game called "Riddle of the Beast," which has a dark, current-day horror-fantasy setting involving supernatural elements, conspiracies, and terrifying creatures. Your task is to generate a unique in-world item based on the following specifications.

Item Category: {{{itemType}}}

{{#if theme}}
Incorporate the theme: '{{{theme}}}'.
{{/if}}

{{#if rarity}}
The item should have a rarity level of: {{{rarity}}}. Artifacts should be powerful but might come with a significant drawback or be very hard to acquire. Common items should be generally useful but not game-breaking.
{{/if}}

{{#if statFocus}}
The item's stats or primary effect should be influenced by the following focus: '{{{statFocus}}}'.
{{/if}}

The output for the item must include:
1.  **Item Name:** [A unique and evocative name for the item, fitting a modern horror/occult setting. e.g., "Makeshift Shiv," "Tinfoil-Lined Trench Coat," "Corrupted Smartphone," "Third Eye Serum," "Whispering Lead Pipe."]
2.  **Category Generated:** [Should be '{{{itemType}}}' or a more specific sub-type that fits within '{{{itemType}}}'. e.g., If itemType is 'Gear', this could be 'Defense Gear' or 'Occult Apparel'. If 'Utility', specify sub-category like 'Ammunition', 'Bomb', 'Trap', 'Healing', 'Battery', or 'Miscellaneous'.]
3.  **Lore Description:** [2-3 sentences connecting the item to the world’s supernatural elements, conspiracies, its grim origins, or how it's jury-rigged in a modern horror context. Example: "Found in the refuse of a black-market chop shop, this crudely sharpened piece of scrap metal still hums with a faint, unsettling energy. It whispers of back alleys and desperate acts."]
4.  **Game Effect:** [Detail all mechanical effects. This is crucial. Include:
    *   **Stats/Effects:**
        *   For Gear (Defense): e.g., "-2 damage from Melee Attacks," "Increase Max HP by 1," "Reroll one defense dice," "Immune to BLIND status effect."
        *   For Melee Weapons: e.g., "Attack: A3," "Critical Hits inflict FLINCH for 1 turn." If it has a Weapon Class (Blunt, Exotic, Large, Nimble, Polearm, Sword), mention its passive (e.g., "Blunt Class: Armor Breaker - Re-roll 1 target Defense Dice").
        *   For Ranged Weapons: e.g., "Attack: A2/R4," "WOUND effect lasts for 2 turns." If it has a Weapon Class (Bow, LMG, Magnum, Pistol, Rapid, Revolver, Rifle, Shotgun, SMG, Sniper), mention its special action/passive.
        *   For Augments: e.g., "+2 when attempting an Engineering skill check."
        *   For Utility Items: e.g., "Effect: Target rolls -1 Defense when attacked by Ranged attack of user."
        *   For Consumables: e.g., "Effect: Restore 1 HP to target for each Hit Rolled."
    *   **Element Type:** If applicable, state one of: Physical, Fire, Ice, Electricity, Ether, Nether. (e.g., "Element Type: Fire"). Most basic weapons are Physical.
    *   **Cooldown:** If the item or an ability it grants has a cooldown. (e.g., "Cooldown: 2 round CD," "Cooldown: Once per battle").
    *   **Charges:** If it's a Utility item with limited uses per battle or a Consumable. (e.g., "Charges: 3," "Charges: 1 (Consumed after use)").
    *   **Usage Type:** If the item itself or an ability it grants is an Action, Interrupt, Passive, or FREE Action. (e.g., "Usage Type: Action," "Usage Type: Passive").
    ]
5.  **Rarity Generated:** [The rarity of the item. If a rarity was requested, try to match it. Otherwise, choose an appropriate one: Common, Uncommon, Rare, Artifact.]

Adhere to the "Riddle of the Beast" game's established mechanics:
*   Melee attacks are generally Range 1.
*   Ranged attacks state Attack/Range (e.g., A3/R4).
*   Status effects like POISON, BLEED, MARKED, FLINCH, WOUNDED, BLIND are common.
*   Defensive effects can include damage reduction, stat increases (Max HP, DEF), or immunities.
*   Utility items often provide limited charges per battle. Consumables are one-time use.

The overall tone should be gritty, cryptic, and mysterious. Items often feel scavenged, jury-rigged from modern components, found in decaying urban ruins, or reverse-engineered from cursed technology or occult artifacts. Keep game balance in mind for a challenging modern horror board game experience.
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

