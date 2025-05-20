
import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { Metadata } from 'next';
import { google } from 'googleapis';
import type { ArsenalCard } from '@/types/arsenal';

export const metadata: Metadata = {
  title: 'Character Sheet - Beast Companion',
  description: 'Manage your character stats for Beast.',
};

async function getArsenalCardsFromGoogleSheet(): Promise<ArsenalCard[]> {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    ARSENAL_CARDS_GOOGLE_SHEET_ID,
    ARSENAL_CARDS_GOOGLE_SHEET_RANGE,
  } = process.env;

  const missingVars: string[] = [];
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!ARSENAL_CARDS_GOOGLE_SHEET_ID) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_ID');
  if (!ARSENAL_CARDS_GOOGLE_SHEET_RANGE) missingVars.push('ARSENAL_CARDS_GOOGLE_SHEET_RANGE');

  if (missingVars.length > 0) {
    const detailedErrorMessage = `Arsenal Cards Google Sheets API environment variables are not configured. Missing: ${missingVars.join(', ')}. Please ensure all required variables are correctly set in your .env.local file.`;
    console.error(detailedErrorMessage);
    return [{ id: 'error-arsenal', name: 'System Error', description: detailedErrorMessage } as ArsenalCard];
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
      spreadsheetId: ARSENAL_CARDS_GOOGLE_SHEET_ID,
      range: ARSENAL_CARDS_GOOGLE_SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in Arsenal Cards Google Sheet ID: ${ARSENAL_CARDS_GOOGLE_SHEET_ID} at range: ${ARSENAL_CARDS_GOOGLE_SHEET_RANGE}.`);
      return [{ id: 'warning-arsenal', name: 'System Warning', description: 'No arsenal card data found.' } as ArsenalCard];
    }

    const headers = rows[0] as string[];
    // Sanitize headers: trim and convert to camelCase for easier mapping, or use a direct map
    const sanitizedHeaders = headers.map(h => 
      h.trim().toLowerCase().replace(/\s+(.)/g, (_match, chr) => chr.toUpperCase())
    );
    
    // Helper to get value by header name, trying common variations
    const getColumnIndex = (headerNameVariations: string[]) => {
        for (const variation of headerNameVariations) {
            const lowerVariation = variation.toLowerCase();
            const index = sanitizedHeaders.findIndex(h => h.toLowerCase() === lowerVariation);
            if (index !== -1) return index;
        }
        return -1;
    };

    return rows.slice(1).map((row: any[], index: number): ArsenalCard => {
      const card: Partial<ArsenalCard> = {};
      
      const idIndex = getColumnIndex(['id', 'arsenalid']);
      card.id = idIndex !== -1 && row[idIndex] ? String(row[idIndex]) : `arsenal_row_${index}`;
      
      const nameIndex = getColumnIndex(['arsenal name', 'name', 'title']);
      card.name = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]) : `Unnamed Arsenal ${index + 1}`;

      const descIndex = getColumnIndex(['description', 'desc']);
      card.description = descIndex !== -1 ? String(row[descIndex] || '') : undefined;

      const imageUrlFrontIndex = getColumnIndex(['imageurlfront', 'frontimage', 'imagefront']);
      card.imageUrlFront = imageUrlFrontIndex !== -1 ? String(row[imageUrlFrontIndex] || '') : undefined;
      
      const imageUrlBackIndex = getColumnIndex(['imageurlback', 'backimage', 'imageback']);
      card.imageUrlBack = imageUrlBackIndex !== -1 ? String(row[imageUrlBackIndex] || '') : undefined;

      const numModFields: (keyof ArsenalCard)[] = ['hpMod', 'maxHpMod', 'mvMod', 'defMod', 'sanityMod', 'maxSanityMod', 'meleeAttackMod', 'rangedAttackMod', 'rangedRangeMod'];
      
      // For header matching, allow for spaces e.g. "HP Mod" or direct camelCase "hpMod"
      const headerToFieldMap: Record<string, keyof ArsenalCard> = {
        'hpmod': 'hpMod', 'hp mod': 'hpMod',
        'maxhpmod': 'maxHpMod', 'max hp mod': 'maxHpMod',
        'mvmod': 'mvMod', 'mv mod': 'mvMod',
        'defmod': 'defMod', 'def mod': 'defMod',
        'sanitymod': 'sanityMod', 'sanity mod': 'sanityMod',
        'maxsanitymod': 'maxSanityMod', 'max sanity mod': 'maxSanityMod',
        'meleeattackmod': 'meleeAttackMod', 'melee attack mod': 'meleeAttackMod',
        'rangedattackmod': 'rangedAttackMod', 'ranged attack mod': 'rangedAttackMod',
        'rangedrangemod': 'rangedRangeMod', 'ranged range mod': 'rangedRangeMod',
      };

      numModFields.forEach(field => {
        let colIndex = -1;
        // Try direct camelCase match from sanitizedHeaders first (e.g. hpMod if sheet has "hpMod")
        colIndex = sanitizedHeaders.indexOf(field.toLowerCase() as string);

        // Then try variations from headerToFieldMap
        if (colIndex === -1) {
            const possibleHeaders = Object.keys(headerToFieldMap).filter(h => headerToFieldMap[h] === field);
            for (const headerVariation of possibleHeaders) {
                colIndex = getColumnIndex([headerVariation]); // Use the helper with a single variation
                if (colIndex !== -1) break;
            }
        }
        
        if (colIndex !== -1 && row[colIndex] !== undefined && String(row[colIndex]).trim() !== '') {
          const val = parseFloat(String(row[colIndex]));
          if (!isNaN(val)) {
            (card as any)[field] = val;
          } else {
            (card as any)[field] = 0; // Default to 0 if value is not a number
          }
        } else {
          (card as any)[field] = 0; // Default to 0 if column not found or empty
        }
      });
      return card as ArsenalCard;
    });

  } catch (error) {
    console.error("Error fetching Arsenal Card data from Google Sheets API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ id: 'error-arsenal-fetch', name: 'System Error', description: `Could not load Arsenal Card data. Error: ${errorMessage}` } as ArsenalCard];
  }
}


export default async function CharacterSheetPage() {
  const arsenalCards = await getArsenalCardsFromGoogleSheet();
  return (
    <div className="w-full">
      <CharacterSheetUI arsenalCards={arsenalCards} />
    </div>
  );
}
