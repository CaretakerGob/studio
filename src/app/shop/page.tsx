
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
    return [{ id: 'error-shop-env', name: 'System Error', description: detailedErrorMessage, cost: 0, category: 'Relic' }];
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
        continue; // Skip to the next sheetRange
      }

      const headers = rows[0] as string[];
      const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());

      const nameIndex = sanitizedHeaders.indexOf('name');
      const costIndex = sanitizedHeaders.indexOf('cost');
      const categoryIndex = sanitizedHeaders.indexOf('category');
      const effectIndex = sanitizedHeaders.indexOf('effect'); // This will map to 'description'

      // Simplified essential columns check for the 4 required fields
      if (nameIndex === -1 || costIndex === -1 || categoryIndex === -1 || effectIndex === -1) {
          const missing: string[] = [];
          if (nameIndex === -1) missing.push('Name');
          if (costIndex === -1) missing.push('Cost');
          if (categoryIndex === -1) missing.push('Category');
          if (effectIndex === -1) missing.push('Effect'); // Expecting 'Effect' from sheet
          const errorMsg = `Critical Error: Essential columns (${missing.join(', ')}) not found in Shop Google Sheet tab "${sheetRange}". Headers found: [${sanitizedHeaders.join(', ')}]. Skipping this sheet.`;
          console.error(errorMsg);
          // Optionally, add an error item to allShopItems to indicate this sheet failed
          allShopItems.push({ id: `error-shop-headers-${sheetNameForId}`, name: 'Sheet Error', description: errorMsg, cost: 0, category: 'Relic' });
          continue; 
      }
      
      const validCategories: ShopItemCategory[] = ['Defense', 'Melee Weapon', 'Ranged Weapon', 'Augment', 'Utility', 'Consumable', 'Relic'];

      rows.slice(1).forEach((row: any[], rowIndex: number) => {
        const name = row[nameIndex] ? String(row[nameIndex]).trim() : `Unnamed Item ${sheetNameForId}_${rowIndex + 1}`;
        // Generate ID based on sheet name, row index, and item name to ensure uniqueness
        const id = `${sheetNameForId}_${rowIndex}_${name.toLowerCase().replace(/\s+/g, '_')}`;
        const cost = row[costIndex] ? parseInt(String(row[costIndex]), 10) : 0;
        let category = row[categoryIndex] ? String(row[categoryIndex]).trim() as ShopItemCategory : 'Relic';
        const description = row[effectIndex] ? String(row[effectIndex]).trim() : ''; // 'Effect' column maps to 'description'

        if (isNaN(cost)) {
          console.warn(`Invalid cost for item "${name}" (Row ${rowIndex + 2} in ${sheetRange}). Setting to 0.`);
        }
        if (!validCategories.includes(category)) {
            console.warn(`Invalid category "${category}" for item "${name}" (Row ${rowIndex + 2} in ${sheetRange}). Defaulting to "Relic".`);
            category = 'Relic';
        }

        // Since the sheet is simplified, other fields default to undefined as per ShopItem type
        allShopItems.push({
          id,
          name,
          description, // Mapped from 'Effect' column
          cost: isNaN(cost) ? 0 : cost,
          category,
          // Other fields default to undefined as per ShopItem type
        });
      });

    } catch (error) {
      // Log the original detailed error to the console for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching Shop Items data from Google Sheet range "${sheetRange}": ${errorMessage}`);
      
      allShopItems.push({ 
        id: `error-shop-fetch-${sheetRange.replace('!', '_')}`, 
        name: 'Sheet Fetch Error', 
        description: "error", // Changed to "error" as per user request
        cost: 0, 
        category: 'Relic' 
      });
    }
  }

  if (allShopItems.length === 0 && sheetRanges.length > 0) {
      // This case means all specified sheets were empty or had errors
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
