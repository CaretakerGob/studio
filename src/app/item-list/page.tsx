
import { google } from 'googleapis';
import { ItemListUI, type ItemData } from "@/components/item-list/item-list-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item List - Beast Companion',
  description: 'View a list of items from the game, loaded from Google Sheets.',
};

async function getItemsFromGoogleSheet(): Promise<ItemData[]> {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID || !GOOGLE_SHEET_RANGE) {
    console.error("Google Sheets API environment variables are not configured for items.");
    return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: 'Item List Google Sheets environment variables not configured. Please check your .env.local file (GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE).' }];
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure newlines in private key are correct
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn("No data found in Item Google Sheet or sheet is empty.");
      return [{ Insert: '', Count: '', Color: 'Warning', Type: 'System', Description: `No data found in Item Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.` }];
    }

    const headers = rows[0] as string[];
    // Sanitize headers to make them consistent for indexing (e.g. "Column Name" -> "columnName")
    // This example assumes simple camelCasing. Adjust if your headers are more complex.
    const sanitizedHeaders = headers.map(h => 
      h.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase())
    );
    
    const insertIndex = sanitizedHeaders.indexOf('insert');
    const countIndex = sanitizedHeaders.indexOf('count');
    const colorIndex = sanitizedHeaders.indexOf('color');
    const typeIndex = sanitizedHeaders.indexOf('type');
    const descriptionIndex = sanitizedHeaders.indexOf('description');

    if (insertIndex === -1 || countIndex === -1 || colorIndex === -1 || typeIndex === -1 || descriptionIndex === -1) {
        console.error("Required headers (Insert, Count, Color, Type, Description) not found or mismatch in Item Google Sheet.");
        return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: 'Required headers (Insert, Count, Color, Type, Description) not found or mismatch in the Item Google Sheet. Please check the sheet headers and range.' }];
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

export default async function ItemListPage() {
  const items = await getItemsFromGoogleSheet();
  return (
    <div className="w-full">
      <ItemListUI items={items} />
    </div>
  );
}
