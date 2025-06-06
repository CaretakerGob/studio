import { fetchSheetData } from '@/lib/googleSheets';
import CharacterSheetPage from './client-page'; // Import the client component

// This is the Server Component that fetches data
export default async function ServerDataFetcher() {
  console.log('Executing server-data-fetcher.tsx'); // Added console.log
  let initialRows: string[][] = [];
  let error: string | null = null;

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
        console.log('Fetching data with sheetId:', ARSENAL_CARDS_GOOGLE_SHEET_ID, ' and range:', ARSENAL_CARDS_GOOGLE_SHEET_RANGE); // Added console.log
        const rows = await fetchSheetData({
            sheetId: ARSENAL_CARDS_GOOGLE_SHEET_ID,
            range: ARSENAL_CARDS_GOOGLE_SHEET_RANGE
        });

        console.log('fetchSheetData returned:', rows); // Added console.log

        if (rows) {
          initialRows = rows;
          console.log('Data successfully fetched and assigned to initialRows'); // Added console.log
        } else {
           const warningMessage = `No data found in Google Sheet ID: ${ARSENAL_CARDS_GOOGLE_SHEET_ID} at range: ${ARSENAL_CARDS_GOOGLE_SHEET_RANGE}.`;
           // We'll still pass an empty array, the client component can handle displaying no data
           console.warn(warningMessage);
           console.log('fetchSheetData returned no rows or null'); // Added console.log
        }
    }

  } catch (err: any) {
    error = `Failed to fetch arsenal data from Google Sheets: ${err.message || String(err)}`;
    console.error("Error in server-side data fetching for arsenal cards:", err);
    console.log('Error during data fetching:', err); // Added console.log
  }

  // Pass the fetched rows (or empty array) to the client component
  // We are not passing the error directly as a prop, the client component will handle
  // the lack of data in initialRows or potential worker errors.
  return <CharacterSheetPage initialRows={initialRows} />;
}
// End of file