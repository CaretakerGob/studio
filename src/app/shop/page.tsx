
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
    SHOP_ITEMS_GOOGLE_SHEET_RANGE, // Now expected to be comma-separated, e.g., "Sheet1!A:D,Sheet2!A:D"
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!SHOP_ITEMS_GOOGLE_SHEET_ID) missingVars.push('SHOP_ITEMS_GOOGLE_SHEET_ID');
  if (!SHOP_ITEMS_GOOGLE_SHEET_RANGE) missingVars.push('SHOP_ITEMS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Shop Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables are set in .env.local. SHOP_ITEMS_GOOGLE_SHEET_RANGE should be a comma-separated list of sheet names/ranges (e.g., "Weapons!A:D,Armor!A:D").`;
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
      console.log(`Fetching shop items from: ${sheetRange}`);
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
      const categoryIndex = sanitizedHeaders.indexOf('category'); // Intentionally try to find it for each sheet
      const effectIndex = sanitizedHeaders.indexOf('effect'); 

      if (nameIndex === -1 || costIndex === -1 || effectIndex === -1) {
          const missing: string[] = [];
          if (nameIndex === -1) missing.push('Name');
          if (costIndex === -1) missing.push('Cost');
          if (effectIndex === -1) missing.push('Effect');
          const errorMsg = `Critical Error: Essential columns (Name, Cost, Effect) not found in Shop Google Sheet tab "${sheetRange}". Headers found: [${sanitizedHeaders.join(', ')}]. Skipping this sheet.`;
          console.error(errorMsg);
          allShopItems.push({ id: `error-shop-headers-${sheetNameForId}`, name: 'Sheet Error', description: "error", cost: 0, category: 'Relic' });
          continue; 
      }
      
      const validCategories: ShopItemCategory[] = ['Defense', 'Melee Weapon', 'Ranged Weapon', 'Augment', 'Utility', 'Consumable', 'Relic'];

      rows.slice(1).forEach((row: any[], rowIndex: number) => {
        const name = row[nameIndex] ? String(row[nameIndex]).trim() : `Unnamed Item ${sheetNameForId}_${rowIndex + 1}`;
        const id = `${sheetNameForId}_${rowIndex}_${name.toLowerCase().replace(/\s+/g, '_')}`;
        const cost = row[costIndex] ? parseInt(String(row[costIndex]), 10) : 0;
        const description = row[effectIndex] ? String(row[effectIndex]).trim() : ''; 

        let category: ShopItemCategory = 'Relic'; // Default category

        if (categoryIndex !== -1) { // "Category" column header exists in this sheet
            const rawCategoryValue = row[categoryIndex] ? String(row[categoryIndex]).trim() : "";
            if (rawCategoryValue && validCategories.includes(rawCategoryValue as ShopItemCategory)) {
                category = rawCategoryValue as ShopItemCategory;
            } else if (rawCategoryValue) { // Column exists, value exists, but value is not a valid category
                console.warn(`Invalid category value "${rawCategoryValue}" for item "${name}" in sheet "${sheetRange}", row ${rowIndex + 2}. Defaulting to "Relic". Valid categories are: ${validCategories.join(', ')}.`);
            } else { // Column exists, but cell is empty for this item
                 console.warn(`Missing category value for item "${name}" in sheet "${sheetRange}", row ${rowIndex + 2}. Defaulting to "Relic".`);
            }
        } else { // "Category" column header does NOT exist in this sheet
            console.warn(`"Category" column header not found in sheet "${sheetRange}". Items from this sheet (e.g., "${name}", Row ${rowIndex + 2}) will default to "Relic" category.`);
        }


        allShopItems.push({
          id,
          name,
          description, 
          cost: isNaN(cost) ? 0 : cost,
          category, // Use the determined category
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching Shop Items data from Google Sheet range "${sheetRange}": ${errorMessage}`);
      allShopItems.push({ 
        id: `error-shop-fetch-${sheetRange.replace('!', '_')}`, 
        name: 'Sheet Fetch Error', 
        description: "error", 
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

