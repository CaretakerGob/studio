// Assuming this is the function that processes the Google Sheet data for arsenal cards
// This is a hypothetical example based on your request.
// Replace with your actual function.
interface ArsenalCardDataFromSheet {
  // ... other properties
  'URL Front'?: string;
  'URL Back'?: string;
}

function processArsenalSheetData(data: ArsenalCardDataFromSheet[]): ArsenalCard[] {
  return data.map(item => ({
    // ... map other properties
    frontImageUrl: item['URL Front'] || '', // Extract 'URL Front'
    backImageUrl: item['URL Back'] || '', // Extract 'URL Back'
  }));
}

interface ArsenalCard {
    // ... other properties
    frontImageUrl: string;
    backImageUrl: string;
}

// Your existing code for fetching and processing the sheet data would use this function.
// Example usage (replace with your actual implementation):
// const rawSheetData: ArsenalCardDataFromSheet[] = fetchArsenalDataFromGoogleSheet();
// const arsenalCards: ArsenalCard[] = processArsenalSheetData(rawSheetData);