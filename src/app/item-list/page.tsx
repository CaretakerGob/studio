
import { google } from 'googleapis';
import { EventsUI } from "@/components/events/events-ui";
import type { EventData } from "@/types/event";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Events - Riddle of the Beast Companion',
  description: 'Track and manage game events from Google Sheets.',
};

async function getEventsFromGoogleSheet(): Promise<EventData[]> {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, EVENTS_GOOGLE_SHEET_ID, EVENTS_GOOGLE_SHEET_RANGE } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!EVENTS_GOOGLE_SHEET_ID) missingVars.push('EVENTS_GOOGLE_SHEET_ID');
  if (!EVENTS_GOOGLE_SHEET_RANGE) missingVars.push('EVENTS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Events Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, EVENTS_GOOGLE_SHEET_ID, EVENTS_GOOGLE_SHEET_RANGE) are correctly set in your .env.local file. Remember to restart your development server after making changes to .env.local.`;
    console.error(detailedErrorMessage);
    return [{ eventName: 'Error', date: '', location: 'System', description: detailedErrorMessage, outcome: '' }];
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
      spreadsheetId: EVENTS_GOOGLE_SHEET_ID,
      range: EVENTS_GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Events Google Sheet ID: ${EVENTS_GOOGLE_SHEET_ID} at range: ${EVENTS_GOOGLE_SHEET_RANGE}.`);
      return [{ eventName: 'Warning', date: '', location: 'System', description: `No data found in Events Google Sheet ID: ${EVENTS_GOOGLE_SHEET_ID} at range: ${EVENTS_GOOGLE_SHEET_RANGE}. The sheet might be empty or the range incorrect.`, outcome: '' }];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase()));
    
    const eventNameIndex = sanitizedHeaders.indexOf('eventName');
    const dateIndex = sanitizedHeaders.indexOf('date');
    const locationIndex = sanitizedHeaders.indexOf('location');
    const descriptionIndex = sanitizedHeaders.indexOf('description');
    const outcomeIndex = sanitizedHeaders.indexOf('outcome');

    if (eventNameIndex === -1 || dateIndex === -1 || locationIndex === -1 || descriptionIndex === -1 || outcomeIndex === -1) {
      const missingHeaderFields = ['Event Name', 'Date', 'Location', 'Description', 'Outcome'].filter(expectedHeader => 
        !sanitizedHeaders.includes(expectedHeader.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase()))
      );
      const errorMessage = `Required headers (Event Name, Date, Location, Description, Outcome) not found or mismatch in Events Google Sheet. Missing or mismatched headers: ${missingHeaderFields.join(', ') || 'Unknown (please check column order and naming)'}. Please check the sheet headers and range. Expected headers: Event Name, Date, Location, Description, Outcome.`;
      console.error(errorMessage);
      return [{ eventName: 'Error', date: '', location: 'System', description: errorMessage, outcome: '' }];
    }

    return rows.slice(1).map((row: any[]): EventData => ({
      eventName: row[eventNameIndex] || '',
      date: row[dateIndex] || '',
      location: row[locationIndex] || '',
      description: row[descriptionIndex] || '',
      outcome: row[outcomeIndex] || '',
    }));

  } catch (error) {
    console.error("Error fetching data from Events Google Sheets API:", error);
    const errorMessageContent = error instanceof Error ? error.message : String(error);
    return [{ eventName: 'Error', date: '', location: 'System', description: `Could not load events from Google Sheets. Error: ${errorMessageContent}`, outcome: '' }];
  }
}

export default async function ItemListPageAsEventsPage() { // Renamed function to avoid conflict, will be used for events
  const events = await getEventsFromGoogleSheet();
  return (
    <div className="w-full">
      <EventsUI events={events} />
    </div>
  );
}
