
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
    console.error("Google Sheets API environment variables are not configured.");
    return [{ Color: 'Error', Type: 'System', Description: 'Google Sheets environment variables not configured. Please check your .env.local file.' }];
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
      console.warn("No data found in Google Sheet or sheet is empty.");
      return [{ Color: 'Warning', Type: 'System', Description: `No data found in Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.` }];
    }

    // Assume the first row contains headers
    const headers = rows[0] as string[];
    const colorIndex = headers.findIndex(h => h.trim().toLowerCase() === 'color');
    const typeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'type');
    const descriptionIndex = headers.findIndex(h => h.trim().toLowerCase() === 'description');

    if (colorIndex === -1 || typeIndex === -1 || descriptionIndex === -1) {
        console.error("Required headers (Color, Type, Description) not found in Google Sheet.");
        return [{ Color: 'Error', Type: 'System', Description: 'Required headers (Color, Type, Description) not found in the Google Sheet. Please check the sheet headers and range.' }];
    }

    return rows.slice(1).map((row: any[]) => ({
      Color: row[colorIndex] || '',
      Type: row[typeIndex] || '',
      Description: row[descriptionIndex] || '',
    }));

  } catch (error) {
    console.error("Error fetching data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return [{ Color: 'Error', Type: 'System', Description: `Could not load items from Google Sheets. Error: ${errorMessage}` }];
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
