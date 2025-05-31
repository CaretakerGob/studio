
import { google } from 'googleapis';
import { ShopUI } from "@/components/shop/shop-ui";
import type { Metadata } from 'next';
import type { ShopItem, ShopItemCategory, UtilitySubCategory } from '@/types/shop';

export const metadata: Metadata = {
  title: 'Whispers & Wares - Shop',
  description: 'Browse and purchase unique items for your adventures.',
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
    const detailedErrorMessage = `Shop Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables are set in .env.local.`;
    console.error(detailedErrorMessage);
    return [{ id: 'error-shop-env', name: 'System Error', description: detailedErrorMessage, cost: 0, category: 'Relic' }];
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHOP_ITEMS_GOOGLE_SHEET_ID,
      range: SHOP_ITEMS_GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Shop Items Google Sheet ID: ${SHOP_ITEMS_GOOGLE_SHEET_ID} at range: ${SHOP_ITEMS_GOOGLE_SHEET_RANGE}.`);
      return [{ id: 'warning-shop-empty', name: 'System Warning', description: 'No shop item data found in Google Sheet.', cost: 0, category: 'Relic' }];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());

    const getColumnIndex = (headerNameVariations: string[]) => {
      for (const variation of headerNameVariations) {
        const index = sanitizedHeaders.indexOf(variation.toLowerCase());
        if (index !== -1) return index;
      }
      return -1;
    };
    
    const idIndex = getColumnIndex(['id', 'item id']);
    const nameIndex = getColumnIndex(['name', 'item name']);
    const descriptionIndex = getColumnIndex(['description', 'desc']);
    const costIndex = getColumnIndex(['cost', 'price']);
    const categoryIndex = getColumnIndex(['category', 'item category']);
    const imageUrlIndex = getColumnIndex(['image url', 'imageurl', 'image']);
    const dataAiHintIndex = getColumnIndex(['data ai hint', 'ai hint']);
    const subCategoryIndex = getColumnIndex(['subcategory', 'sub category']);
    const stockIndex = getColumnIndex(['stock', 'quantity']);
    const weaponClassIndex = getColumnIndex(['weapon class', 'class']);
    const attackIndex = getColumnIndex(['attack', 'atk']);
    const actionTypeIndex = getColumnIndex(['action type', 'type']);
    const chargesIndex = getColumnIndex(['charges', 'uses']);
    const skillCheckIndex = getColumnIndex(['skill check', 'check']);

    // Essential columns check
    if (idIndex === -1 || nameIndex === -1 || costIndex === -1 || categoryIndex === -1) {
        const missing: string[] = [];
        if (idIndex === -1) missing.push('ID');
        if (nameIndex === -1) missing.push('Name');
        if (costIndex === -1) missing.push('Cost');
        if (categoryIndex === -1) missing.push('Category');
        const errorMsg = `Critical Error: Essential columns (${missing.join(', ')}) not found in Shop Google Sheet. Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error(errorMsg);
        return [{ id: 'error-shop-headers', name: 'Sheet Error', description: errorMsg, cost: 0, category: 'Relic' }];
    }

    const validCategories: ShopItemCategory[] = ['Defense', 'Melee Weapon', 'Ranged Weapon', 'Augment', 'Utility', 'Consumable', 'Relic'];
    const validSubCategories: UtilitySubCategory[] = ['Ammunition', 'Bombs', 'Traps', 'Healing', 'Battery', 'Miscellaneous'];
    const validActionTypes: ShopItem['actionType'][] = ['Free Action', 'Action', 'Interrupt', 'Passive'];

    return rows.slice(1).map((row: any[], rowIndex: number): ShopItem | null => {
      const id = row[idIndex] ? String(row[idIndex]).trim() : `item_${rowIndex + 1}`;
      const name = row[nameIndex] ? String(row[nameIndex]).trim() : `Unnamed Item ${rowIndex + 1}`;
      const cost = row[costIndex] ? parseInt(String(row[costIndex]), 10) : 0;
      const category = row[categoryIndex] ? String(row[categoryIndex]).trim() as ShopItemCategory : 'Relic';

      if (isNaN(cost)) {
        console.warn(`Invalid cost for item "${name}" (Row ${rowIndex + 2}). Setting to 0.`);
      }
      if (!validCategories.includes(category)) {
          console.warn(`Invalid category "${category}" for item "${name}" (Row ${rowIndex + 2}). Defaulting to "Relic".`);
          return { id, name, description: row[descriptionIndex] || '', cost: isNaN(cost) ? 0 : cost, category: 'Relic' };
      }

      let subCategoryVal = subCategoryIndex !== -1 && row[subCategoryIndex] ? String(row[subCategoryIndex]).trim() as UtilitySubCategory : undefined;
      if (category === 'Utility' && subCategoryVal && !validSubCategories.includes(subCategoryVal)) {
          console.warn(`Invalid subCategory "${subCategoryVal}" for Utility item "${name}" (Row ${rowIndex + 2}). Setting to undefined.`);
          subCategoryVal = undefined;
      } else if (category !== 'Utility') {
          subCategoryVal = undefined;
      }
      
      let actionTypeVal = actionTypeIndex !== -1 && row[actionTypeIndex] ? String(row[actionTypeIndex]).trim() as ShopItem['actionType'] : undefined;
      if(actionTypeVal && !validActionTypes.includes(actionTypeVal)){
          console.warn(`Invalid actionType "${actionTypeVal}" for item "${name}" (Row ${rowIndex + 2}). Setting to undefined.`);
          actionTypeVal = undefined;
      }
      
      let chargesVal: number | 'Battery' | undefined = undefined;
      if (chargesIndex !== -1 && row[chargesIndex]) {
          const rawCharges = String(row[chargesIndex]).trim();
          if (rawCharges.toLowerCase() === 'battery') {
              chargesVal = 'Battery';
          } else {
              const numCharges = parseInt(rawCharges, 10);
              if (!isNaN(numCharges)) {
                  chargesVal = numCharges;
              } else {
                  console.warn(`Invalid charges value "${rawCharges}" for item "${name}" (Row ${rowIndex + 2}). Setting to undefined.`);
              }
          }
      }

      return {
        id,
        name,
        description: descriptionIndex !== -1 ? (row[descriptionIndex] || '') : '',
        cost: isNaN(cost) ? 0 : cost,
        category,
        imageUrl: imageUrlIndex !== -1 ? (row[imageUrlIndex] || undefined) : undefined,
        dataAiHint: dataAiHintIndex !== -1 ? (row[dataAiHintIndex] || undefined) : undefined,
        subCategory: subCategoryVal,
        stock: stockIndex !== -1 && row[stockIndex] ? parseInt(String(row[stockIndex]), 10) : undefined,
        weaponClass: weaponClassIndex !== -1 ? (row[weaponClassIndex] || undefined) : undefined,
        attack: attackIndex !== -1 ? (row[attackIndex] || undefined) : undefined,
        actionType: actionTypeVal,
        charges: chargesVal,
        skillCheck: skillCheckIndex !== -1 ? (row[skillCheckIndex] || undefined) : undefined,
      };
    }).filter(item => item !== null) as ShopItem[];

  } catch (error) {
    console.error("Error fetching Shop Items data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ id: 'error-shop-fetch', name: 'System Error', description: `Could not load Shop Items. Error: ${errorMessage}`, cost: 0, category: 'Relic' }];
  }
}

export default async function ShopPage() {
  const shopItems = await getShopItemsFromGoogleSheet();
  return (
    <div className="w-full">
      <ShopUI initialInventory={shopItems} />
    </div>
  );
}
