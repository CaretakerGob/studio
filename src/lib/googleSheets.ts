import { google } from 'googleapis';

interface FetchSheetDataOptions {
  sheetId: string;
  range: string;
}

interface GetColumnIndexOptions {
  sanitizedHeaders: string[];
  headerNameVariations: string[];
}

/**
 * Fetches raw data rows from a Google Sheet.
 * Handles authentication and basic error checking for environment variables.
 *
 * @param options - An object containing the sheetId and range.
 * @returns A promise that resolves with an array of rows (string[][]), or null if an error occurs or no data is found.
 * @throws Error if required environment variables are not set.
 */
export async function fetchSheetData({ sheetId, range }: FetchSheetDataOptions): Promise<string[][] | null> {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!sheetId) missingVars.push('sheetId (parameter)');
  if (!range) missingVars.push('range (parameter)');


  if (missingVars.length > 0) {
    const detailedErrorMessage = `Google Sheets API environment variables or parameters are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables and parameters are correctly set.`;
    console.error(detailedErrorMessage);
    throw new Error(detailedErrorMessage); // Throw an error as data cannot be fetched without these
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY!.replace(/\\\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Google Sheet ID: ${sheetId} at range: ${range}.`);
      return null; // Return null for no data found
    }

    return rows as string[][];

  } catch (error) {
    console.error(`Error fetching data from Google Sheets API for sheet ID ${sheetId} and range ${range}:`, error);
    // It's often better to throw specific errors or return a Result type in production code
    // but for this utility, re-throwing the error allows the caller to handle it.
    throw error;
  }
}

/**
 * Sanitizes header strings by trimming whitespace and converting to lowercase.
 *
 * @param headerRow - The array of raw header values (typically the first row).
 * @returns An array of sanitized header strings.
 */
export function getSanitizedHeaders(headerRow: string[]): string[] {
  if (!headerRow) return [];
  return headerRow.map(h => String(h || '').trim().toLowerCase());
}

/**
 * Finds the column index for a given header based on possible name variations (case-insensitive).
 *
 * @param options - An object containing the array of sanitized headers and an array of possible header name variations.
 * @returns The index of the first matching header, or -1 if none is found.
 */
export function getColumnIndex({ sanitizedHeaders, headerNameVariations }: GetColumnIndexOptions): number {
    if (!sanitizedHeaders || sanitizedHeaders.length === 0 || !headerNameVariations || headerNameVariations.length === 0) {
        return -1;
    }
  for (const variation of headerNameVariations) {
    const index = sanitizedHeaders.indexOf(variation.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
}