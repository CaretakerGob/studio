
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export function InvestigationsUI() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <ClipboardList className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Investigations</CardTitle>
        </div>
        <CardDescription>Manage and track your ongoing investigations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <ClipboardList className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Investigations feature coming soon.</p>
          <p className="text-sm text-muted-foreground/80">Track clues, objectives, and progress here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
