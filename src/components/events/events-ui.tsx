
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export function EventsUI() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <CalendarDays className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Game Events</CardTitle>
        </div>
        <CardDescription>Manage and track in-game events. (Placeholder)</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This section will be used to display and manage game events.
          Future functionality will be added here.
        </p>
      </CardContent>
    </Card>
  );
}
