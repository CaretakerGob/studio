"use client";

import React, { useEffect, useState } from 'react';
import { CharacterSheetUI } from "@/components/character-sheet/character-sheet-ui";
import type { ArsenalCard } from '@/types/arsenal';

// Define the worker
const arsenalDataWorker = typeof window !== 'undefined' ? new Worker(new URL('@/workers/arsenal-data.worker.ts', import.meta.url)) : null;

// Define interface for props
interface CharacterSheetPageProps {
  initialRows: string[][];
}
export default function CharacterSheetPage({ initialRows }: { initialRows: string[][] }) {
  const [arsenalCards, setArsenalCards] = useState<ArsenalCard[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('initialRows:', initialRows); // Add this line

    // Send initial data to the worker for processing
    if (arsenalDataWorker && initialRows && initialRows.length > 0) {
      arsenalDataWorker.postMessage({ type: 'processArsenalData', payload: initialRows });
    } else if (initialRows && initialRows.length === 0) {
        // Handle case where no data was fetched
        setArsenalCards([]);
        setIsLoading(false);
    } else if (!arsenalDataWorker) {
         setError('Web Workers are not supported in this environment.');
         setIsLoading(false);
    }

    // Listen for the worker's response
    if (arsenalDataWorker) {
      arsenalDataWorker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'arsenalDataProcessed') {
          setArsenalCards(payload as ArsenalCard[]);
          setIsLoading(false);
        } else if (type === 'error') {
          setError(`Worker error: ${payload}`);
          console.error('Worker reported an error:', payload);
          setIsLoading(false);
        }
      };

      // Handle potential worker errors (e.g., syntax errors in worker script)
      arsenalDataWorker.onerror = (event) => {
        setError(`Worker error: ${event.message}`);
        console.error('Web Worker error:', event);
        setIsLoading(false);
      };
    }


    // Clean up the worker on component unmount
    return () => {
      if (arsenalDataWorker) {
        arsenalDataWorker.onmessage = null;
        arsenalDataWorker.onerror = null;
        // Terminate the worker if necessary, but often not needed if it's stateless
        // arsenalDataWorker.terminate();
      }
    };
  }, [initialRows]); // Add initialRows to dependency array

  // Render loading state, error state, or the UI component
  if (isLoading) {
    return <div className="w-full text-center py-10">Loading Arsenal Cards...</div>;
  }

  if (error) {
    return (
      <div className="w-full text-center py-10 text-destructive">\
        <p>Error loading Arsenal Cards:</p>
        <p className="text-sm mt-2 whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  if (!arsenalCards) {
     return <div className="w-full text-center py-10 text-muted-foreground">No Arsenal Cards available.</div>;
  }


  return (
    <div className="w-full">
      <CharacterSheetUI arsenalCards={arsenalCards} />
    </div>
  );
}
// End of file