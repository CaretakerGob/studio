import type { EventData } from '@/types/event'; // Assuming you have an event type defined

// This code should be placed in a new file, e.g., src/workers/event-data.worker.ts

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

// Main data processing logic
function processEventData(rows: string[][]): EventData[] {
  if (!rows || rows.length === 0) {
    console.warn('Worker: No data rows received for event processing.');
    return [];
  }

  const headers = rows[0] as string[];
  const sanitizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());

  // Define expected headers and their corresponding keys in EventData
  const headerMap: Record<string, keyof EventData> = {
    'type': 'Type',
    'location color': 'Location Color',
    '1d6 roll': '1d6 Roll',
    'unit': 'Unit',
    'description': 'Description',
    'passive/toggle': 'Passive/Toggle',
    'skill check': 'Skill Check',
  };

  const eventData: EventData[] = [];

  rows.slice(1).forEach((row: any[]) => {
    const eventEntry: Partial<EventData> = {};

    Object.keys(headerMap).forEach(headerKey => {
        const columnIndex = getColumnIndex([headerKey], sanitizedHeaders);
        if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            eventEntry[headerMap[headerKey]] = String(row[columnIndex] || '').trim();
        }
    });

    // Add a default empty string for any missing required keys from EventData
    const defaultEntry: EventData = {
        'Type': '',
        'Location Color': '',
        '1d6 Roll': '',
        'Unit': '',
        'Description': '',
        'Passive/Toggle': '',
        'Skill Check': '',
    };

    eventData.push({ ...defaultEntry, ...eventEntry } as EventData);
  });

  return eventData;
}


// Listen for messages from the main thread
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'processEventData') {
    try {
      const rawRows = payload as string[][];
      const processedData = processEventData(rawRows);
      // Post the processed data back to the main thread
      self.postMessage({ type: 'eventDataProcessed', payload: processedData });
    } catch (error: any) {
      console.error('Worker error processing event data:', error);
      // Post an error message back
      self.postMessage({ type: 'error', payload: error.message || 'Unknown worker error' });
    }
  }
};