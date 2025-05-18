
import { google } from 'googleapis';
import { ItemListUI, type ItemData } from "@/components/item-list/item-list-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion',
  description: 'View a list of items from the game, loaded from Google Sheets.',
};

async function getItemsFromGoogleSheet(): Promise<ItemData[]> {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!GOOGLE_SHEET_ID) missingVars.push('GOOGLE_SHEET_ID');
  if (!GOOGLE_SHEET_RANGE) missingVars.push('GOOGLE_SHEET_RANGE');


  if (missingVars.length > 0) {
    const detailedErrorMessage = `Item List Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE) are correctly set in your .env.local file. Remember to restart your development server after making changes to .env.local.`;
    console.error(detailedErrorMessage);
    return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: detailedErrorMessage }];
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
      spreadsheetId: GOOGLE_SHEET_ID,
      range: GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Item Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.`);
      return [{ Insert: '', Count: '', Color: 'Warning', Type: 'System', Description: `No data found in Item Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.` }];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => 
      h.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase())
    );
    
    const insertIndex = sanitizedHeaders.indexOf('insert');
    const countIndex = sanitizedHeaders.indexOf('count');
    const colorIndex = sanitizedHeaders.indexOf('color');
    const typeIndex = sanitizedHeaders.indexOf('type');
    const descriptionIndex = sanitizedHeaders.indexOf('description');

    if (insertIndex === -1 || countIndex === -1 || colorIndex === -1 || typeIndex === -1 || descriptionIndex === -1) {
        const missingHeaderFields = ['Insert', 'Count', 'Color', 'Type', 'Description'].filter(expectedHeader => 
            !sanitizedHeaders.includes(expectedHeader.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase()))
        );
        const errorMessage = `Required headers (Insert, Count, Color, Type, Description) not found or mismatch in Item Google Sheet. Missing or mismatched: ${missingHeaderFields.join(', ') || 'Unknown'}. Please check sheet headers and range.`;
        console.error(errorMessage);
        return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: errorMessage }];
    }

    return rows.slice(1).map((row: any[]): ItemData => ({
      Insert: row[insertIndex] || '',
      Count: row[countIndex] || '',
      Color: row[colorIndex] || '',
      Type: row[typeIndex] || '',
      Description: row[descriptionIndex] || '',
    }));

  } catch (error) {
    console.error("Error fetching data from Item Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: `Could not load items from Google Sheets. Error: ${errorMessage}` }];
  }
}

export default async function EventsPageAsItemsPage() { // Renamed function to avoid conflict, will be used for items
  const items = await getItemsFromGoogleSheet();
  return (
    <div className="w-full">
      <ItemListUI items={items} />
    </div>
  );
}
