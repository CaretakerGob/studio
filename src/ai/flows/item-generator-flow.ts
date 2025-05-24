
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
  itemTypeGenerated: z.string().describe('The specific type of item that was generated (e.g., Makeshift Shiv, Reinforced Jacket, Cracked Cellphone). This should align with the requested itemType.'),
  description: z.string().describe('A detailed and thematic description of the item, including its appearance and lore in a modern horror context.'),
  gameEffect: z.string().describe('The mechanical effect of the item in the game (e.g., "+1 Attack", "Grants poison resistance", "Once per game: heal 1d6 HP"). Be specific and balanced for a current day dark horror board game.'),
});
export type ItemGeneratorOutput = z.infer<typeof ItemGeneratorOutputSchema>;

export async function generateGameItem(input: ItemGeneratorInput): Promise<ItemGeneratorOutput> {
  return itemGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameItemPrompt',
  input: { schema: ItemGeneratorInputSchema },
  output: { schema: ItemGeneratorOutputSchema },
  prompt: `You are an expert game designer creating items for a current day dark horror board game called 'Riddle of the Beast'.
The game is challenging and has a gritty, unsettling atmosphere. Items should reflect this modern horror theme.

Generate a unique {{{itemType}}}.
{{#if theme}}
The item should strongly incorporate the theme: '{{{theme}}}'. For example, if the theme is 'cursed', consider adding a drawback or a dark twist to its benefits, or if it's 'makeshift', describe its crude construction.
{{/if}}

Follow these guidelines for generation:

1.  **Item Name**:
    *   Evocative and unique, fitting a modern horror setting (e.g., "Whispering Static Device", "Survivalist's Utility Knife", "Bloodied Medical Kit", "Flickering Halogen Lamp").
    *   Avoid overly fantastical or generic names like "Magic Sword".

2.  **Item Type Generated**:
    *   Be specific and modern.
    *   If itemType was 'weapon', this could be 'Makeshift Shiv', 'Modified Flare Gun', 'Heavy Wrench', 'Taser', 'Hunting Rifle', 'Baseball Bat with Nails'.
    *   If itemType was 'armor', this could be 'Reinforced Biker Jacket', 'Makeshift Body Armor', 'Gas Mask with Filter', 'Thick Work Boots'.
    *   If itemType was 'trinket', this could be 'Cracked Cellphone Screen', 'Flickering LED Flashlight', 'Tarnished Locket', 'Bundle of Old Keys'.

3.  **Description**:
    *   Focus on modern dark horror aesthetics: describe its appearance using everyday materials, potential ominous urban history, or unsettling technological feel.
    *   Hint at its power or danger in a contemporary context.
    *   Example for a weapon: "A kitchen knife, its blade chipped and handle wrapped crudely with electrical tape. It still bears faint, dark stains and feels unnervingly cold to the touch."
    *   Example for a trinket: "An old, cracked smartphone. The screen occasionally flickers to life with static, and a faint, unintelligible whisper can sometimes be heard from its speaker."

4.  **Game Effect**:
    *   **Balance is Key:** Effects should be useful but not game-breaking for a challenging board game.
    *   **Clarity:** Clearly state the mechanical effect.
    *   **Weapons:**
        *   Attack bonuses typically range from +1 to +3.
        *   May add status effects (e.g., BLEED, POISON, STUN, PARALYZE) or have limited ammo/durability.
        *   Example: "+1 Attack. On a critical hit, target suffers 1 BLEED damage for 2 rounds." or "1 shot, deals 2 damage, target is STUNNED for 1 turn."
    *   **Armor:**
        *   Defense bonuses typically range from +1 to +2.
        *   May grant resistance to specific modern hazards (e.g., minor chemical resistance, blunt force trauma) or minor protection against status effects.
        *   Example: "+1 Defense. Gain resistance to POISON effects." or "Reduces damage from traps by 1."
    *   **Trinkets:**
        *   Often provide passive bonuses or limited-use abilities.
        *   Could be skill check bonuses (e.g., "+1 to Computer Use skill checks", "+1 to Mechanics checks").
        *   Could be once-per-game or once-per-investigation abilities (e.g., "Once per investigation: reroll a failed Sanity check.").
        *   Example: "Once per game, after failing a Sanity check, you may choose to succeed instead but take 1 HP damage."
    *   **Potions (or 'Consumables'):**
        *   Usually consumable with immediate effects. Could be 'Adrenaline Shot', 'Makeshift Bandage', 'Painkillers', 'Energy Drink'.
        *   Example: "Heals 1d6+1 HP." or "Grants +2 MV for 1 turn."
    *   **Scrolls (or 'Notes'/'Blueprints'/'Found Intel'):**
        *   Often consumable, single-use effects, perhaps from found schematics, cryptic notes, or a recovered data chip.
        *   Example: "Reveals one hidden clue on the current location map." or "Allows bypassing one electronic lock." or "Grants +2 to a specific skill check once."

Ensure the generated item fits the dark, challenging, and current day horror theme of 'Riddle of the Beast'.
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

