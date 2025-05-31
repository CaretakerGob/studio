
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheckIcon } from "lucide-react"; // Using ShieldCheckIcon for privacy

export const metadata: Metadata = {
  title: 'Privacy Policy - Riddle of the Beast Companion',
  description: 'Privacy Policy for the Riddle of the Beast Companion application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <ShieldCheckIcon className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </div>
          <CardDescription>
            Your privacy is important to us. This page will outline how we handle your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/30 rounded-lg">
            <h2 className="text-xl font-semibold text-primary mb-3">Coming Soon</h2>
            <p className="text-muted-foreground">
              Our full Privacy Policy is currently being drafted and will be available here shortly.
            </p>
            <p className="text-muted-foreground mt-2">
              We are committed to protecting your privacy. By using this application, you acknowledge that the complete policy is pending.
            </p>
            <p className="text-muted-foreground mt-4">
              Rest assured, any data collected (e.g., for saved characters via Firebase) is handled with care.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Placeholder Information:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>This application uses Firebase for authentication and data storage (e.g., saved characters, user preferences).</li>
              <li>We do not sell your personal data.</li>
              <li>Further details on data collection, use, and protection will be provided in the full policy.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
