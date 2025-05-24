"use client";

import React, { useEffect, useState } from 'react';
import { InvestigationsUI } from "@/components/investigations/investigations-ui";
import type { Metadata } from 'next';
import type { InvestigationData } from "@/types/investigation";

// Import the shared Google Sheets utility function
import { fetchSheetData } from '@/lib/googleSheets';

// Define the worker
const investigationDataWorker = typeof window !== 'undefined' ? new Worker(new URL('@/workers/investigation-data.worker.ts', import.meta.url)) : null;

export default function InvestigationsPage() {
  const [investigationsData, setInvestigationsData] = useState<InvestigationData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvestigationsData = async () => {
      setIsLoading(true);
      setError(null);
      setInvestigationsData(null); // Clear previous data

      if (!investigationDataWorker) {
        setError('Web Workers are not supported in this environment.');
        setIsLoading(false);
        return;
      }

      try {
        const {
          INVESTIGATIONS_GOOGLE_SHEET_ID,
          INVESTIGATIONS_GOOGLE_SHEET_RANGE,
        } = process.env;

        if (!INVESTIGATIONS_GOOGLE_SHEET_ID || !INVESTIGATIONS_GOOGLE_SHEET_RANGE) {
           const missingVars = [];
           if (!INVESTIGATIONS_GOOGLE_SHEET_ID) missingVars.push('INVESTIGATIONS_GOOGLE_SHEET_ID');
           if (!INVESTIGATIONS_GOOGLE_SHEET_RANGE) missingVars.push('INVESTIGATIONS_GOOGLE_SHEET_RANGE');
           const errorMessage = `Google Sheets environment variables are not configured for Investigations. Missing: ${missingVars.join(', ')}. Please ensure they are set in your .env.local file.`;
           setError(errorMessage);
           console.error(errorMessage); // Log error on the client side
           setIsLoading(false);
           return;
        }

        // Fetch raw data from Google Sheets
        const rows = await fetchSheetData(
          spreadsheetId: INVESTIGATIONS_GOOGLE_SHEET_ID,
          range: INVESTIGATIONS_GOOGLE_SHEET_RANGE,
        );

        if (!rows || rows.length === 0) {
          const warningMessage = `No data found in Investigations Google Sheet ID: ${INVESTIGATIONS_GOOGLE_SHEET_ID} at range: ${INVESTIGATIONS_GOOGLE_SHEET_RANGE}.`;
          setError(warningMessage);
          console.warn(warningMessage);
          setIsLoading(false);
          return;
        }

        // Send the raw data to the worker for processing
        investigationDataWorker.postMessage({ type: 'processInvestigationData', payload: rows });

        // Listen for the worker's response
        investigationDataWorker.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'investigationDataProcessed') {
            setInvestigationsData(payload as InvestigationData[]);
            setIsLoading(false);
          } else if (type === 'error') {
            setError(`Worker error: ${payload}`);
            console.error('Worker reported an error:', payload);
            setIsLoading(false);
          }
        };

        // Handle potential worker errors
        investigationDataWorker.onerror = (event) => {
          setError(`Worker error: ${event.message}`);
          console.error('Web Worker error:', event);
          setIsLoading(false);
        };

      } catch (err: any) {
        setError(`Failed to fetch or process investigation data: ${err.message || String(err)}`);
        console.error("Error in loading investigation data:", err);
        setIsLoading(false);
      }
    };

    loadInvestigationsData();

    // Clean up the worker on component unmount
    return () => {
      if (investigationDataWorker) {
        investigationDataWorker.onmessage = null;
        investigationDataWorker.onerror = null;
        // investigationDataWorker.terminate();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Render loading state, error state, or the UI component
  if (isLoading) {
    return <div className="w-full text-center py-10">Loading Investigations...</div>;
  }

  if (error) {
    return (
      <div className="w-full text-center py-10 text-destructive">
        <p>Error loading Investigations:</p>
        <p className="text-sm mt-2 whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  if (!investigationsData) {
     return <div className="w-full text-center py-10 text-muted-foreground">No Investigations available.</div>;
  }

  return (
    <div className="w-full">
      <InvestigationsUI investigations={investigationsData} />
    </div>
  );
}

// Optional: Metadata can remain here
export const metadata: Metadata = {
  title: 'Investigations - Beast Companion',
  description: 'Generate random investigation encounters.', // Updated description
};
