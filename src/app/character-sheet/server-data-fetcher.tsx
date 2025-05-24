import { fetchSheetData } from '@/lib/googleSheets';
import CharacterSheetPage from './page'; // Import the client component

// This is a Server Component
console.log('Executing server-data-fetcher.tsx');

export default async function ServerDataFetcher() {
  let initialRows: string[][] = [];
  let error: string | null = null;

  console.log('Attempting to fetch arsenal data');

  try {
    const {
      ARSENAL_CARDS_GOOGLE_SHEET_ID,
      ARSENAL_CARDS_GOOGLE_SHEET_RANGE,
    } = process.env;

    if (!ARSENAL_CARDS_GOOGLE_SHEET_ID || !ARSENAL_CARDS_GOOGLE_SHEET_RANGE) {
       const missingVars = [];
       if (!ARSENAL_CARDS_GOOGLE_SHEET_ID) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_ID');
       if (!ARSENAL_CARDS_GOOGLE_SHEET_RANGE) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_RANGE');
       const errorMessage = `Google Sheets environment variables are not configured for Arsenal Cards on the server. Missing: ${missingVars.join(', ')}. Please ensure they are set in your .env.local file.`;
       error = errorMessage;
       console.error(errorMessage); // Log error on the server side
    } else {
        console.log('Fetching data with sheetId:', ARSENAL_CARDS_GOOGLE_SHEET_ID, 'and range:', ARSENAL_CARDS_GOOGLE_SHEET_RANGE);
        const rows = await fetchSheetData({
          sheetId: ARSENAL_CARDS_GOOGLE_SHEET_ID,
          range: ARSENAL_CARDS_GOOGLE_SHEET_RANGE
      });


        console.log('fetchSheetData returned:', rows);

        if (rows) {
          initialRows = rows;
          console.log('Data successfully fetched and assigned to initialRows');
        } else {
           const warningMessage = `No data found in Arsenal Cards Google Sheet ID: ${ARSENAL_CARDS_GOOGLE_SHEET_ID} at range: ${ARSENAL_CARDS_GOOGLE_SHEET_RANGE}.`;
           // We'll still pass an empty array, the client component can handle displaying no data
           console.warn(warningMessage);
           console.log('fetchSheetData returned no rows or null');
        }
    }

  } catch (err: any) {
    error = `Failed to fetch arsenal data from Google Sheets: ${err.message || String(err)}`;
    console.error("Error in server-side data fetching for arsenal cards:", err);
    console.log('Error during data fetching:', err);
  }

  // Pass the fetched rows (or empty array) to the client component
  // We are not passing the error directly as a prop, the client component will handle
  // the lack of data in initialRows or potential worker errors.
  return <CharacterSheetPage initialRows={initialRows} />;
}
