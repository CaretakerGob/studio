

import { fetchSheetData, getSanitizedHeaders, getColumnIndex } from '@/lib/googleSheets';
import { EventsSheetUI, type EventsSheetData } from "@/components/events/events-sheet-ui"; // Updated import
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events - Beast Companion', // This page displays the Google Sheet data, which the user calls "Events"
  description: 'Generate a random event from game events loaded from Google Sheets.', // Updated description
};

// This page is for the "/item-list" route, which is linked by "Events" in the sidebar.
// It will display the ITEM data from the Google Sheet (which the user refers to as Events).
async function getSheetData(): Promise<EventsSheetData[]> { // Renamed function and return type
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetRange = process.env.GOOGLE_SHEET_RANGE;

  if (!sheetId || !sheetRange) {
    const errorMessage = `Google Sheets API environment variables for game data (GOOGLE_SHEET_ID or GOOGLE_SHEET_RANGE) are not configured.`;
    console.error(errorMessage);
 return [{ Insert: '', Count: '', Color: 'Error', Type: 'System', Description: errorMessage }];
  }

  try {
    const rows = await fetchSheetData(sheetId, sheetRange);

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Google Sheet ID: ${sheetId} at range: ${sheetRange}.`);
 return [{ Insert: '', Count: '', Color: 'Warning', Type: 'System', Description: `No data found in Google Sheet ID: ${sheetId} at range: ${sheetRange}.` }];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = getSanitizedHeaders(headers);

    const insertIndex = getColumnIndex(sanitizedHeaders, ['Insert']);
    const countIndex = getColumnIndex(sanitizedHeaders, ['Count']);
    const colorIndex = getColumnIndex(sanitizedHeaders, ['Color']);
    const typeIndex = getColumnIndex(sanitizedHeaders, ['Type']);
    const descriptionIndex = getColumnIndex(sanitizedHeaders, ['Description']);

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
