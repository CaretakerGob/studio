
import { google } from 'googleapis';
import { ShopUI } from "@/components/shop/shop-ui";
import type { Metadata } from 'next';
import type { ShopItem, ShopItemCategory, UtilitySubCategory } from '@/types/shop';

export const metadata: Metadata = {
  title: 'Whispers & Wares - Shop',
  description: 'Browse and purchase unique items for your adventures.',
};

const validCategories: ShopItemCategory[] = ['Defense', 'Melee Weapon', 'Ranged Weapon', 'Augment', 'Utility', 'Consumable', 'Relic'];
const validUtilitySubCategories: UtilitySubCategory[] = ['Ammunition', 'Bombs', 'Traps', 'Healing', 'Battery', 'Miscellaneous'];

// Mapping for common singulars from sheet to the defined UtilitySubCategory plurals/exact names
const subCategorySingularToPluralMap: Partial<Record<string, UtilitySubCategory>> = {
  'ammunition': 'Ammunition',
  'bomb': 'Bombs',
  'traps': 'Traps', // Changed from 'trap' to 'traps' to match type
  'healing': 'Healing',
  'battery': 'Battery',
  'miscellaneous': 'Miscellaneous',
  // Add 'trap' if sheet might use singular "Trap" for "Utility Trap"
  'trap': 'Traps'
};


async function getShopItemsFromGoogleSheet(): Promise<ShopItem[]> {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    SHOP_ITEMS_GOOGLE_SHEET_ID,
    SHOP_ITEMS_GOOGLE_SHEET_RANGE,
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!SHOP_ITEMS_GOOGLE_SHEET_ID) missingVars.push('SHOP_ITEMS_GOOGLE_SHEET_ID');
  if (!SHOP_ITEMS_GOOGLE_SHEET_RANGE) missingVars.push('SHOP_ITEMS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Shop Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables are set in .env.local. SHOP_ITEMS_GOOGLE_SHEET_RANGE should be a comma-separated list of sheet names/ranges (e.g., "Weapons!A:N,Armor!A:N").`;
    console.error(detailedErrorMessage);
    return [{ id: 'error-shop-env', name: 'System Error', description: "error", cost: 0, category: 'Relic' }];
  }

  const allShopItems: ShopItem[] = [];
  const sheetRanges = SHOP_ITEMS_GOOGLE_SHEET_RANGE.split(',').map(s => s.trim()).filter(Boolean);

  if (sheetRanges.length === 0) {
    console.warn("No sheet ranges provided in SHOP_ITEMS_GOOGLE_SHEET_RANGE.");
    return [{ id: 'warning-shop-no-ranges', name: 'System Warning', description: 'No sheet ranges configured for the shop.', cost: 0, category: 'Relic' }];
  }

  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
  const sheets = google.sheets({ version: 'v4', auth });

  for (const sheetRange of sheetRanges) {
    try {
      // console.log(`Fetching shop items from: ${sheetRange}`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHOP_ITEMS_GOOGLE_SHEET_ID,
        range: sheetRange,
      });

      const rows = response.data.values;
      const sheetNameForId = sheetRange.split('!')[0] || 'defaultSheet';

      if (!rows || rows.length === 0) {
        console.warn(`No data found in Shop Items Google Sheet ID: ${SHOP_ITEMS_GOOGLE_SHEET_ID} at range: ${sheetRange}. Skipping this sheet.`);
        continue;
      }

      const headers = rows[0] as string[];
      const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());

      const nameIndex = sanitizedHeaders.indexOf('name');
      const costIndex = sanitizedHeaders.indexOf('cost');
      const categoryIndex = sanitizedHeaders.indexOf('category');
      const effectIndex = sanitizedHeaders.indexOf('effect'); // Maps to description
      const subCategoryIndex = sanitizedHeaders.indexOf('subcategory');
      const imageUrlIndex = sanitizedHeaders.indexOf('image url');
      const dataAiHintIndex = sanitizedHeaders.indexOf('data ai hint');
      const stockIndex = sanitizedHeaders.indexOf('stock');
      const weaponClassIndex = sanitizedHeaders.indexOf('weapon class');
      const attackIndex = sanitizedHeaders.indexOf('attack');
      const actionTypeIndex = sanitizedHeaders.indexOf('action type');
      const chargesIndex = sanitizedHeaders.indexOf('charges');
      const skillCheckIndex = sanitizedHeaders.indexOf('skill check');


      if (nameIndex === -1 || costIndex === -1 || effectIndex === -1) {
        const missing: string[] = [];
        if (nameIndex === -1) missing.push('Name');
        if (costIndex === -1) missing.push('Cost');
        if (effectIndex === -1) missing.push('Effect (for description)');
        const errorMsg = `Critical Error: Essential columns (Name, Cost, Effect) not found in Shop Google Sheet tab "${sheetRange}". Headers found: [${sanitizedHeaders.join(', ')}]. Skipping this sheet.`;
        console.error(errorMsg);
        allShopItems.push({ id: `error-shop-headers-${sheetNameForId}`, name: 'Sheet Error', description: "error", cost: 0, category: 'Relic' });
        continue;
      }

      rows.slice(1).forEach((row: any[], rowIndex: number) => {
        const name = row[nameIndex] ? String(row[nameIndex]).trim() : `Unnamed Item ${sheetNameForId}_${rowIndex + 1}`;
        const id = `${sheetNameForId}_${rowIndex}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
        const cost = row[costIndex] ? parseInt(String(row[costIndex]), 10) : 0;
        const description = row[effectIndex] ? String(row[effectIndex]).trim() : 'No description available.';

        let parsedCategory: ShopItemCategory = 'Relic';
        let parsedSubCategory: UtilitySubCategory | undefined = undefined;
        const explicitSubCategoryFromColumn = subCategoryIndex !== -1 && row[subCategoryIndex] ? String(row[subCategoryIndex]).trim() : null;

        if (categoryIndex !== -1 && row[categoryIndex]) {
            const rawCategoryValue = String(row[categoryIndex]).trim();
            const utilityPrefix = "Utility ";

            if (rawCategoryValue.startsWith(utilityPrefix)) {
                parsedCategory = "Utility";
                const potentialSubCategoryString = rawCategoryValue.substring(utilityPrefix.length).trim();
                const lowerPotentialSub = potentialSubCategoryString.toLowerCase();

                let matchedSub = validUtilitySubCategories.find(
                    sub => sub.toLowerCase() === lowerPotentialSub
                );

                if (!matchedSub) {
                    const mappedPluralOrExact = subCategorySingularToPluralMap[lowerPotentialSub];
                    if (mappedPluralOrExact && validUtilitySubCategories.includes(mappedPluralOrExact)) {
                        matchedSub = mappedPluralOrExact;
                    }
                }
                
                if (matchedSub) {
                    parsedSubCategory = matchedSub;
                } else if (explicitSubCategoryFromColumn && validUtilitySubCategories.includes(explicitSubCategoryFromColumn as UtilitySubCategory)) {
                    parsedSubCategory = explicitSubCategoryFromColumn as UtilitySubCategory;
                } else {
                    // console.warn(`Unmatched/invalid utility sub-category derived from Category column: "${potentialSubCategoryString}" and from explicit SubCategory column: "${explicitSubCategoryFromColumn}" for item "${name}". Defaulting to Miscellaneous.`);
                    parsedSubCategory = 'Miscellaneous';
                }

            } else if (validCategories.includes(rawCategoryValue as ShopItemCategory)) {
                parsedCategory = rawCategoryValue as ShopItemCategory;
                if (parsedCategory === 'Utility' && explicitSubCategoryFromColumn && validUtilitySubCategories.includes(explicitSubCategoryFromColumn as UtilitySubCategory)) {
                    parsedSubCategory = explicitSubCategoryFromColumn as UtilitySubCategory;
                }
            } else if (rawCategoryValue) {
                // console.warn(`Invalid category value "${rawCategoryValue}" for item "${name}". Defaulting to "Relic".`);
            }
        } else if (explicitSubCategoryFromColumn && validUtilitySubCategories.includes(explicitSubCategoryFromColumn as UtilitySubCategory)) {
            parsedCategory = 'Utility';
            parsedSubCategory = explicitSubCategoryFromColumn as UtilitySubCategory;
            // console.warn(`Missing 'Category' column for item "${name}" but found valid 'SubCategory' "${parsedSubCategory}". Assuming 'Utility' category.`);
        }
        
        const stockValue = stockIndex !== -1 && row[stockIndex] ? parseInt(String(row[stockIndex]), 10) : undefined;
        let chargesValue: number | 'Battery' | undefined = undefined;
        if (chargesIndex !== -1 && row[chargesIndex]) {
            const rawCharges = String(row[chargesIndex]).trim();
            if (rawCharges.toLowerCase() === 'battery') {
                chargesValue = 'Battery';
            } else {
                const numCharges = parseInt(rawCharges, 10);
                if (!isNaN(numCharges)) {
                    chargesValue = numCharges;
                }
            }
        }

        const finalItem: ShopItem = {
          id,
          name,
          description,
          cost: isNaN(cost) ? 0 : cost,
          category: parsedCategory,
          subCategory: parsedCategory === 'Utility' ? (parsedSubCategory || 'Miscellaneous') : undefined,
          imageUrl: imageUrlIndex !== -1 && row[imageUrlIndex] ? String(row[imageUrlIndex]).trim() : undefined,
          dataAiHint: dataAiHintIndex !== -1 && row[dataAiHintIndex] ? String(row[dataAiHintIndex]).trim() : undefined,
          stock: stockValue,
          weaponClass: weaponClassIndex !== -1 && row[weaponClassIndex] ? String(row[weaponClassIndex]).trim() : undefined,
          attack: attackIndex !== -1 && row[attackIndex] ? String(row[attackIndex]).trim() : undefined,
          actionType: actionTypeIndex !== -1 && row[actionTypeIndex] ? String(row[actionTypeIndex]).trim() as ShopItem['actionType'] : undefined,
          charges: chargesValue,
          skillCheck: skillCheckIndex !== -1 && row[skillCheckIndex] ? String(row[skillCheckIndex]).trim() : undefined,
        };

        if (finalItem.category === 'Consumable' && finalItem.stock === undefined) {
          finalItem.stock = typeof finalItem.charges === 'number' ? finalItem.charges : 1;
        }

        allShopItems.push(finalItem);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching Shop Items data from Google Sheet range "${sheetRange}": ${errorMessage}`);
      allShopItems.push({
        id: `error-shop-fetch-${sheetRange.replace('!', '_')}`,
        name: 'Sheet Fetch Error',
        description: "error", // Simplified error description for UI
        cost: 0,
        category: 'Relic'
      });
    }
  }

  if (allShopItems.length === 0 && sheetRanges.length > 0) {
    return [{ id: 'warning-shop-empty-all', name: 'System Warning', description: 'No shop items found in any of the specified Google Sheet tabs, or all tabs had errors.', cost: 0, category: 'Relic' }];
  }

  return allShopItems;
}

export default async function ShopPage() {
  const shopItems = await getShopItemsFromGoogleSheet();
  return (
    <div className="w-full">
      <ShopUI initialInventory={shopItems} />
    </div>
  );
}
