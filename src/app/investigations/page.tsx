
import { InvestigationsUI } from "@/components/investigations/investigations-ui";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investigations - Beast Companion',
  description: 'Manage and track your investigations.',
};

export default function InvestigationsPage() {
  return (
    <div className="w-full">
      <InvestigationsUI />
    </div>
  );
}
