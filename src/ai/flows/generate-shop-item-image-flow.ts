
'use server';
/**
 * @fileOverview An AI-powered image generator for shop items in Riddle of the Beast.
 * This flow generates images based on item name, description, and category.
 *
 * - generateShopItemImage - A function that generates an image for a shop item.
 * - GenerateShopItemImageInput - The input type for the function.
 * - GenerateShopItemImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateShopItemImageInputSchema = z.object({
  itemName: z.string().describe('The name of the shop item.'),
  itemDescription: z.string().describe('The description of the shop item.'),
  itemCategory: z.string().describe('The category of the shop item (e.g., Melee Weapon, Defense, Consumable).'),
  itemSubCategory: z.string().optional().describe('The sub-category if applicable (e.g., Bomb, Healing for Utility items).'),
  itemWeaponClass: z.string().optional().describe('The weapon class if applicable (e.g., Sword, Pistol).'),
});
export type GenerateShopItemImageInput = z.infer<typeof GenerateShopItemImageInputSchema>;

const GenerateShopItemImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...')."),
});
export type GenerateShopItemImageOutput = z.infer<typeof GenerateShopItemImageOutputSchema>;

export async function generateShopItemImage(input: GenerateShopItemImageInput): Promise<GenerateShopItemImageOutput> {
  return generateShopItemImageFlow(input);
}

const generateShopItemImageFlow = ai.defineFlow(
  {
    name: 'generateShopItemImageFlow',
    inputSchema: GenerateShopItemImageInputSchema,
    outputSchema: GenerateShopItemImageOutputSchema,
  },
  async (input) => {
    let promptText = `Generate an image for a game item for "Riddle of the Beast".
Item Name: ${input.itemName}
Category: ${input.itemCategory}
Description: ${input.itemDescription}`;

    if (input.itemSubCategory) {
      promptText += `\nSub-Category: ${input.itemSubCategory}`;
    }
    if (input.itemWeaponClass) {
      promptText += `\nWeapon Class: ${input.itemWeaponClass}`;
    }

    promptText += `\nThe game has a dark, gritty, current-day horror-fantasy theme. The image should be a clear depiction of the item, suitable for an inventory icon or shop display. Focus on a single item against a simple or subtly textured dark background. Avoid text overlays on the image.`;
    
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // Must use this model for image generation
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
          // Optional: Add safety settings if needed
          // safetySettings: [
          //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          // ],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation did not return a media URL.');
      }
      return { imageDataUri: media.url };

    } catch (error) {
      console.error('Error in generateShopItemImageFlow:', error);
      // Consider returning a specific error structure or re-throwing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during image generation.';
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }
);
