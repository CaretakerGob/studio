

import { google } from 'googleapis';
import { EventsSheetUI, type EventsSheetData } from "@/components/events/events-sheet-ui"; // Updated import
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events - Beast Companion', // This page displays the Google Sheet data, which the user calls "Events"
  description: 'Generate a random event from game events loaded from Google Sheets.', // Updated description
};

// This page is for the "/item-list" route, which is linked by "Events" in the sidebar.
// It will display the ITEM data from the Google Sheet (which the user refers to as Events).
async function getSheetData(): Promise<EventsSheetData[]> { // Renamed function and return type
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!GOOGLE_SHEET_ID) missingVars.push('GOOGLE_SHEET_ID'); 
  if (!GOOGLE_SHEET_RANGE) missingVars.push('GOOGLE_SHEET_RANGE'); 

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Google Sheets API environment variables for game data are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_RANGE) are correctly set in your .env.local file. Remember to restart your development server after making changes to .env.local.`;
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
      console.warn(`No data found in Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.`);
      return [{ Insert: '', Count: '', Color: 'Warning', Type: 'System', Description: `No data found in Google Sheet ID: ${GOOGLE_SHEET_ID} at range: ${GOOGLE_SHEET_RANGE}.` }];
    }

    const headers = rows[0] as string[];
    // Simplified sanitization if headers are expected to be simple like "Insert", "Color"
    const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());
    
    const insertIndex = sanitizedHeaders.indexOf('insert');
    const countIndex = sanitizedHeaders.indexOf('count');
    const colorIndex = sanitizedHeaders.indexOf('color');
    const typeIndex = sanitizedHeaders.indexOf('type');
    const descriptionIndex = sanitizedHeaders.indexOf('description');

    // Make Insert and Count optional in terms of sheet presence, but ensure Color, Type, Description are there.
    const requiredHeaders = ['color', 'type', 'description'];
    const missingRequiredHeaders = requiredHeaders.filter(expectedHeader => !sanitizedHeaders.includes(expectedHeader));

    if (missingRequiredHeaders.length > 0) {
        const errorMessage = `Required headers (${requiredHeaders.join(', ')}) not found or mismatch in Google Sheet. Missing or mismatched: ${missingRequiredHeaders.join(', ')}. Please check sheet headers and range. Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error(errorMessage);
        return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: errorMessage }];
    }


    return rows.slice(1).map((row: any[]): EventsSheetData => ({ // Updated return type
      Insert: insertIndex !== -1 ? (row[insertIndex] || '') : '', // Handle if Insert col doesn't exist
      Count: countIndex !== -1 ? (row[countIndex] || '') : '', // Handle if Count col doesn't exist
      Color: row[colorIndex] || '',
      Type: row[typeIndex] || '',
      Description: row[descriptionIndex] || '',
    }));

  } catch (error) {
    console.error("Error fetching data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: `Could not load game data from Google Sheets. Error: ${errorMessage}` }];
  }
}

export default async function DisplayEventsFromSheetPage() { 
  const eventsData = await getSheetData(); // Renamed variable
  return (
    <div className="w-full">
      <EventsSheetUI // Updated component usage
        items={eventsData} // Prop name is items, but data is eventsData
        title="Events" // This page is titled "Events"
        cardDescription="Select a color and generate a random event." // Updated description
      />
    </div>
  );
}
