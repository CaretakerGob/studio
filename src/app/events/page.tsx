
import { EventsUI } from "@/components/events/events-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events - Riddle of the Beast Companion',
  description: 'Track and manage game events.',
};

export default function EventsPage() {
  return (
    <div className="w-full">
      <EventsUI />
    </div>
  );
}
