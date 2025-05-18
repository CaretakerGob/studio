
import { google } from 'googleapis';
import { InvestigationsUI } from "@/components/investigations/investigations-ui";
import type { InvestigationData } from "@/types/investigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investigations - Beast Companion',
  description: 'Manage and track your investigations.',
};

async function getInvestigationsFromGoogleSheet(): Promise<InvestigationData[]> {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    INVESTIGATIONS_GOOGLE_SHEET_ID, // New variable for Investigations
    INVESTIGATIONS_GOOGLE_SHEET_RANGE, // New variable for Investigations
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!INVESTIGATIONS_GOOGLE_SHEET_ID) missingVars.push('INVESTIGATIONS_GOOGLE_SHEET_ID');
  if (!INVESTIGATIONS_GOOGLE_SHEET_RANGE) missingVars.push('INVESTIGATIONS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Investigations Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, INVESTIGATIONS_GOOGLE_SHEET_ID, INVESTIGATIONS_GOOGLE_SHEET_RANGE) are correctly set in your .env.local file. Remember to restart your development server after making changes to .env.local.`;
    console.error(detailedErrorMessage);
    // Return a single error object that matches InvestigationData structure for consistent handling in UI
    return [{ 'Location Color': 'Error', '1d6 Roll': '', NPC: 'System', Unit: '', Persona: '', Demand: '', 'Skill Check': '', Goals: '', Passive: detailedErrorMessage, Description: detailedErrorMessage } as unknown as InvestigationData];
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
      spreadsheetId: INVESTIGATIONS_GOOGLE_SHEET_ID,
      range: INVESTIGATIONS_GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      const warningMessage = `No data found in Investigations Google Sheet ID: ${INVESTIGATIONS_GOOGLE_SHEET_ID} at range: ${INVESTIGATIONS_GOOGLE_SHEET_RANGE}.`;
      console.warn(warningMessage);
      return [{ 'Location Color': 'Warning', '1d6 Roll': '', NPC: 'System', Unit: '', Persona: '', Demand: '', 'Skill Check': '', Goals: '', Passive: warningMessage, Description: warningMessage } as unknown as InvestigationData];
    }

    const headers = rows[0] as string[];
    // Sanitize headers to match InvestigationData keys (handle potential case differences or extra spaces)
    // This might not be strictly necessary if sheet headers exactly match JSON keys
    const sanitizedHeaders = headers.map(h => h.trim()); 

    return rows.slice(1).map((row: any[]): InvestigationData => {
      const investigationEntry: any = {};
      sanitizedHeaders.forEach((header, index) => {
        investigationEntry[header] = row[index] || '';
      });
      return investigationEntry as InvestigationData;
    });

  } catch (error) {
    console.error("Error fetching Investigation data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ 'Location Color': 'Error', '1d6 Roll': '', NPC: 'System', Unit: '', Persona: '', Demand: '', 'Skill Check': '', Goals: '', Passive: `Could not load Investigation data. Error: ${errorMessage}`, Description: `Could not load Investigation data. Error: ${errorMessage}` } as unknown as InvestigationData];
  }
}

export default async function InvestigationsPage() {
  const investigationsData = await getInvestigationsFromGoogleSheet();
  return (
    <div className="w-full">
      <InvestigationsUI investigations={investigationsData} />
    </div>
  );
}
