
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: 'Terms of Service - Riddle of the Beast Companion',
  description: 'Terms of Service for the Riddle of the Beast Companion application.',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <FileText className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
          </div>
          <CardDescription>
            Please read these terms and conditions carefully before using Our Service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/30 rounded-lg">
            <h2 className="text-xl font-semibold text-primary mb-3">Coming Soon</h2>
            <p className="text-muted-foreground">
              Our full Terms of Service are currently being drafted and will be available here shortly.
            </p>
            <p className="text-muted-foreground mt-2">
              By using this application, you acknowledge that the complete terms are pending. We appreciate your patience.
            </p>
            <p className="text-muted-foreground mt-4">
              In the meantime, please use the application responsibly and enjoy your Riddle of the Beast adventures!
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Placeholder Information:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>This application is intended as a companion tool for the "Riddle of the Beast" board game.</li>
              <li>User data, such as saved characters and profile information, is stored via Firebase.</li>
              <li>AI-generated content is for illustrative and gameplay enhancement purposes.</li>
              <li>No real-money transactions are processed through this application.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
