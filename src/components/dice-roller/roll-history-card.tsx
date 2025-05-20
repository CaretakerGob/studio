
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CombatDieFaceImage, type CombatDieFace } from './combat-die-face-image';
import type { LatestRollData, NumberedDiceGroupResult, CombatDiceResult } from './dice-roller-ui'; // Adjust if type definitions are moved

interface RollHistoryCardProps {
  rollHistory: LatestRollData[];
  onClearHistory: () => void;
}

export function RollHistoryCard({ rollHistory, onClearHistory }: RollHistoryCardProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Roll History</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearHistory} disabled={rollHistory.length === 0}>
            <RotateCcw className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
        <CardDescription>Last 20 rolls are stored here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {rollHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No rolls yet. Make your first roll!</p>
          ) : (
            <ul className="space-y-3">
              {rollHistory.map((r, index) => (
                <li key={index} className={cn(
                  "p-3 rounded-md border bg-card/80 flex flex-col items-start text-sm transition-all",
                  index === 0 ? "border-primary shadow-sm" : "border-border"
                )}>
                  {r.type === 'numbered' ? (
                    <>
                      <div className="flex justify-between w-full items-center mb-1">
                        <span className="font-medium">
                          {(r.groups as NumberedDiceGroupResult[]).map(g => g.notation).join(' + ')}
                        </span>
                        <Badge variant={index === 0 ? "default" : "secondary"} className={cn("text-xs", index === 0 ? "bg-primary text-primary-foreground" : "")}>
                          Total: {r.overallTotal}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1 space-y-1">
                        {(r.groups as NumberedDiceGroupResult[]).map((g, gi) => (
                          <div key={gi}>
                            {g.notation}: [{g.rolls.join(', ')}] (Subtotal: {g.total})
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                     <>
                      <div className="flex justify-between w-full items-center mb-1">
                         <span className="font-medium">{(r.groups[0] as CombatDiceResult).notation}</span>
                         <Badge variant={index === 0 ? "default" : "secondary"} className={cn("text-xs", index === 0 ? "bg-primary text-primary-foreground" : "")}>
                           Summary
                         </Badge>
                       </div>
                      <div className="text-xs text-muted-foreground mb-1">
                         {(r.groups[0] as CombatDiceResult).summary}
                       </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                         {(r.groups[0] as CombatDiceResult).rolls.map((face, i) => (
                           <CombatDieFaceImage key={i} face={face} size={16} className="mx-0.5"/>
                         ))}
                       </div>
                     </>
                  )}
                  <p className="text-xs text-muted-foreground/70 self-end">{r.timestamp.toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
