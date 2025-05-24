import type { InvestigationData } from '@/types/investigation';

// Helper function to get column index (simplified for worker)
function getColumnIndex(headerVariations: string[], sanitizedHeaders: string[]): number {
    if (!sanitizedHeaders || sanitizedHeaders.length === 0 || !headerVariations || headerVariations.length === 0) {
        return -1;
    }
    const lowerCaseVariations = headerVariations.map(v => v.toLowerCase());
    for (const variation of lowerCaseVariations) {
        const index = sanitizedHeaders.indexOf(variation);
        if (index !== -1) return index;
    }
    return -1;
}


// Main data processing logic (moved and adapted from getInvestigationsFromGoogleSheet)
function processInvestigationData(rows: string[][]): InvestigationData[] {
    if (!rows || rows.length === 0) {
        console.warn(`Worker: No data rows received for investigation processing.`);
        return [];
    }

    const headers = rows[0] as string[];
    const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());

    const investigations: InvestigationData[] = [];

    rows.slice(1).forEach((row: string[], rowIndex: number) => {
        const investigationEntry: any = {};

        const locationColorIndex = getColumnIndex(['location color', 'locationcolor', 'color'], sanitizedHeaders);
        if (locationColorIndex !== -1) investigationEntry['Location Color'] = row[locationColorIndex] || '';

        const rollIndex = getColumnIndex(['1d6 roll', '1d6roll', 'roll'], sanitizedHeaders);
        if (rollIndex !== -1) investigationEntry['1d6 Roll'] = row[rollIndex] || '';

        const npcIndex = getColumnIndex(['npc'], sanitizedHeaders);
        if (npcIndex !== -1) investigationEntry['NPC'] = row[npcIndex] || '';

        const unitIndex = getColumnIndex(['unit'], sanitizedHeaders);
        if (unitIndex !== -1) investigationEntry['Unit'] = row[unitIndex] || '';

        const personaIndex = getColumnIndex(['persona'], sanitizedHeaders);
        if (personaIndex !== -1) investigationEntry['Persona'] = row[personaIndex] || '';

        const demandIndex = getColumnIndex(['demand'], sanitizedHeaders);
        if (demandIndex !== -1) investigationEntry['Demand'] = row[demandIndex] || '';

        const skillCheckIndex = getColumnIndex(['skill check', 'skillcheck'], sanitizedHeaders);
        if (skillCheckIndex !== -1) investigationEntry['Skill Check'] = row[skillCheckIndex] || '';

        const goalsIndex = getColumnIndex(['goals'], sanitizedHeaders);
        if (goalsIndex !== -1) investigationEntry['Goals'] = row[goalsIndex] || '';

        const passiveIndex = getColumnIndex(['passive'], sanitizedHeaders);
        if (passiveIndex !== -1) investigationEntry['Passive'] = row[passiveIndex] || '';

        const descriptionIndex = getColumnIndex(['description'], sanitizedHeaders);
        if (descriptionIndex !== -1) investigationEntry['Description'] = row[descriptionIndex] || '';

        // Ensure all potential keys from InvestigationData are present, even if empty
        const defaultEntry: InvestigationData = {
            'Location Color': '',
            '1d6 Roll': '',
            NPC: '',
            Unit: '',
            Persona: '',
            Demand: '',
            'Skill Check': '',
            Goals: '',
            Passive: '',
            Description: '',
        };

        investigations.push({ ...defaultEntry, ...investigationEntry } as InvestigationData);
    });

    return investigations;
}


// Listen for messages from the main thread
self.onmessage = (event) => {
    const { type, payload } = event.data;

    if (type === 'processInvestigationData') {
        try {
            const rawRows = payload as string[][];
            const processedData = processInvestigationData(rawRows);
            // Post the processed data back to the main thread
            self.postMessage({ type: 'investigationDataProcessed', payload: processedData });
        } catch (error: any) {
            console.error('Worker error processing investigation data:', error);
            // Post an error message back
            self.postMessage({ type: 'error', payload: error.message || 'Unknown worker error' });
        }
    }
};