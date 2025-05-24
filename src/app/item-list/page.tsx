

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
    // Simplified sanitization for direct mapping if headers are "Color", "Type", "Description", "Insert", "Count"
    const sanitizedHeaders = headers.map(h => String(h || '').trim());
    
    // Find indices based on exact (case-insensitive) header names
    const getIndex = (name: string) => sanitizedHeaders.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const insertIndex = getIndex('Insert');
    const countIndex = getIndex('Count');
    const colorIndex = getIndex('Color');
    const typeIndex = getIndex('Type');
    const descriptionIndex = getIndex('Description');

    // Check for essential headers
    const requiredHeaderNames = ['Color', 'Type', 'Description'];
    const missingRequiredHeaders = requiredHeaderNames.filter(expectedHeader => getIndex(expectedHeader) === -1);

    if (missingRequiredHeaders.length > 0) {
        const errorMessage = `Required headers (${requiredHeaderNames.join(', ')}) not found or mismatch in Google Sheet. Missing or mismatched: ${missingRequiredHeaders.join(', ')}. Please check sheet headers and range. Headers found: [${sanitizedHeaders.join(', ')}]`;
        console.error(errorMessage);
        return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: errorMessage }];
    }


    return rows.slice(1).map((row: any[]): EventsSheetData => ({
      Insert: insertIndex !== -1 ? (row[insertIndex] || '') : '',
      Count: countIndex !== -1 ? (row[countIndex] || '') : '',
      Color: colorIndex !== -1 ? (row[colorIndex] || '') : '', // Should always exist due to check above
      Type: typeIndex !== -1 ? (row[typeIndex] || '') : '', // Should always exist
      Description: descriptionIndex !== -1 ? (row[descriptionIndex] || '') : '', // Should always exist
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
