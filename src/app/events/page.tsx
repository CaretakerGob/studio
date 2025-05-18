
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

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !EVENTS_GOOGLE_SHEET_ID || !EVENTS_GOOGLE_SHEET_RANGE) {
    console.error("Events Google Sheets API environment variables are not configured.");
    return [{ eventName: 'Error', date: '', location: 'System', description: 'Events Google Sheets API environment variables are not configured. Please ensure `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `EVENTS_GOOGLE_SHEET_ID`, and `EVENTS_GOOGLE_SHEET_RANGE` are all correctly set in your .env.local file. Remember to restart your development server after making changes to .env.local.', outcome: '' }];
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: EVENTS_GOOGLE_SHEET_ID,
      range: EVENTS_GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn("No data found in Events Google Sheet or sheet is empty.");
      return [{ eventName: 'Warning', date: '', location: 'System', description: `No data found in Events Google Sheet ID: ${EVENTS_GOOGLE_SHEET_ID} at range: ${EVENTS_GOOGLE_SHEET_RANGE}.`, outcome: '' }];
    }

    const headers = rows[0] as string[];
    // Sanitize headers to camelCase for mapping to EventData interface
    const sanitizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+(.)/g, (match, chr) => chr.toUpperCase()));
    
    const eventNameIndex = sanitizedHeaders.indexOf('eventName');
    const dateIndex = sanitizedHeaders.indexOf('date');
    const locationIndex = sanitizedHeaders.indexOf('location');
    const descriptionIndex = sanitizedHeaders.indexOf('description');
    const outcomeIndex = sanitizedHeaders.indexOf('outcome');

    if (eventNameIndex === -1 || dateIndex === -1 || locationIndex === -1 || descriptionIndex === -1 || outcomeIndex === -1) {
      console.error("Required headers (Event Name, Date, Location, Description, Outcome) not found or mismatch in Events Google Sheet.");
      return [{ eventName: 'Error', date: '', location: 'System', description: 'Required headers (Event Name, Date, Location, Description, Outcome) not found or mismatch in the Events Google Sheet. Please check the sheet headers and range. Expected headers: Event Name, Date, Location, Description, Outcome.', outcome: '' }];
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return [{ eventName: 'Error', date: '', location: 'System', description: `Could not load events from Google Sheets. Error: ${errorMessage}`, outcome: '' }];
  }
}

export default async function EventsPage() {
  const events = await getEventsFromGoogleSheet();
  return (
    <div className="w-full">
      <EventsUI events={events} />
    </div>
  );
}
