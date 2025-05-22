
import { SharedSpaceUI } from "@/components/shared-space/shared-space-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Space - Beast Companion',
  description: 'Join a shared session with an access code.',
};

export default function SharedSpacePage() {
  return (
    <div className="w-full">
      <SharedSpaceUI />
    </div>
  );
}
