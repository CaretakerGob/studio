"use client";

import React, { useEffect, useState } from 'react';
import { EventCardUI } from "@/components/event-card/event-card-ui";
import type { Metadata } from 'next';
import type { EventData } from '@/types/event';

// Import the shared Google Sheets utility function
import { fetchSheetData } from '@/lib/googleSheets';

// Define the worker
const eventDataWorker = typeof window !== 'undefined' ? new Worker(new URL('@/workers/event-data.worker.ts', import.meta.url)) : null;

export default function EventListPage() {
  const [eventData, setEventData] = useState<EventData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEventData = async () => {
      setIsLoading(true);
      setError(null);
      setEventData(null); // Clear previous data

      if (!eventDataWorker) {
        setError('Web Workers are not supported in this environment.');
        setIsLoading(false);
        return;
      }

      try {
        const {
          EVENTS_GOOGLE_SHEET_ID,
          EVENTS_GOOGLE_SHEET_RANGE,
        } = process.env;

        if (!EVENTS_GOOGLE_SHEET_ID || !EVENTS_GOOGLE_SHEET_RANGE) {
           const missingVars = [];
           if (!EVENTS_GOOGLE_SHEET_ID) missingVars.push('EVENTS_GOOGLE_SHEET_ID');
           if (!EVENTS_GOOGLE_SHEET_RANGE) missingVars.push('EVENTS_GOOGLE_SHEET_RANGE');
           const errorMessage = `Google Sheets environment variables are not configured for Events. Missing: ${missingVars.join(', ')}. Please ensure they are set in your .env.local file.`;
           setError(errorMessage);
           console.error(errorMessage); // Log error on the client side
           setIsLoading(false);
           return;
        }

        // Fetch raw data from Google Sheets
        const rows = await fetchSheetData(
          spreadsheetId: EVENTS_GOOGLE_SHEET_ID,
          range: EVENTS_GOOGLE_SHEET_RANGE,
        );

        if (!rows || rows.length === 0) {
          const warningMessage = `No data found in Events Google Sheet ID: ${EVENTS_GOOGLE_SHEET_ID} at range: ${EVENTS_GOOGLE_SHEET_RANGE}.`;
          setError(warningMessage);
          console.warn(warningMessage);
          setIsLoading(false);
          return;
        }

        // Send the raw data to the worker for processing
        eventDataWorker.postMessage({ type: 'processEventData', payload: rows });

        // Listen for the worker's response
        eventDataWorker.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'eventDataProcessed') {
            setEventData(payload as EventData[]);
            setIsLoading(false);
          } else if (type === 'error') {
            setError(`Worker error: ${payload}`);
            console.error('Worker reported an error:', payload);
            setIsLoading(false);
          }
        };

        // Handle potential worker errors
        eventDataWorker.onerror = (event) => {
          setError(`Worker error: ${event.message}`);
          console.error('Web Worker error:', event);
          setIsLoading(false);
        };

      } catch (err: any) {
        setError(`Failed to fetch or process event data: ${err.message || String(err)}`);
        console.error("Error in loading event data:", err);
        setIsLoading(false);
      }
    };

    loadEventData();

    // Clean up the worker on component unmount
    return () => {
      if (eventDataWorker) {
        eventDataWorker.onmessage = null;
        eventDataWorker.onerror = null;
        // eventDataWorker.terminate();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Render loading state, error state, or the UI component
  if (isLoading) {
    return <div className="w-full text-center py-10">Loading Events...</div>;
  }

  if (error) {
    return (
      <div className="w-full text-center py-10 text-destructive">
        <p>Error loading Events:</p>
        <p className="text-sm mt-2 whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  if (!eventData) {
     return <div className="w-full text-center py-10 text-muted-foreground">No Events available.</div>;
  }

  return (
    <div className="w-full">
      <EventCardUI eventData={eventData} />
    </div>
  );
}

// Optional: Metadata can remain here
export const metadata: Metadata = {
  title: 'Event List - Beast Companion',
  description: 'Browse and manage event cards.',
};