
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CombatDieFaceImage, type CombatDieFace } from './combat-die-face-image';
import type { LatestRollData, NumberedDiceGroupResult, CombatDiceResult } from './dice-roller-ui'; // Adjust if type definitions are moved

const faceTypeLabels: Record<CombatDieFace, string> = {
  swordandshield: 'Sword & Shield',
  'double-sword': 'Double Sword',
  blank: 'Blank',
};

interface LatestRollCardProps {
  latestRoll: LatestRollData | null;
  latestRollKey: number;
}

export function LatestRollCard({ latestRoll, latestRollKey }: LatestRollCardProps) {
  if (!latestRoll) {
    return null;
  }

  const renderNumberedGroupRolls = (rolls: number[]) => {
    return rolls.map((roll, index) => (
     <Badge key={index} variant="default" className="text-lg px-3 py-1 bg-primary/20 text-primary-foreground border border-primary align-middle">
       {roll}
     </Badge>
   ));
 };

 const renderCombatRolls = (rolls: CombatDieFace[]) => {
   return rolls.map((roll, index) => (
     <div key={index} className="p-1 inline-block align-middle">
       <CombatDieFaceImage face={roll} size={48} />
     </div>
   ));
 };

  return (
    <Card
      key={latestRollKey}
      className="mt-6 bg-card/50 border-primary shadow-md transition-all animate-in fade-in duration-500"
    >
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          Latest Roll Results:
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestRoll.type === 'numbered' && latestRoll.groups.map((group, index) => (
          <div key={index} className="p-3 border border-muted-foreground/30 rounded-md bg-muted/20">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="secondary" className="text-base">{(group as NumberedDiceGroupResult).notation}</Badge>
              <p className="text-xl font-bold text-primary">Total: {(group as NumberedDiceGroupResult).total}</p>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-1 flex-wrap min-h-[30px]">
              {renderNumberedGroupRolls((group as NumberedDiceGroupResult).rolls)}
            </div>
          </div>
        ))}
        {latestRoll.type === 'numbered' && latestRoll.overallTotal !== undefined && (
          <p className="text-2xl font-bold text-center text-primary mt-3">
            Overall Total: {latestRoll.overallTotal}
          </p>
        )}

        {latestRoll.type === 'combat' && latestRoll.groups.map((group, index) => {
          const combatGroup = group as CombatDiceResult;
          return (
            <div key={index} className="p-3 border border-muted-foreground/30 rounded-md bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="secondary" className="text-base">{combatGroup.notation}</Badge>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-1 mb-3 min-h-[40px]">
                {renderCombatRolls(combatGroup.rolls)}
              </div>
              <div className="flex justify-around items-start text-center mt-4 space-x-2">
                {(['swordandshield', 'double-sword', 'blank'] as CombatDieFace[]).map(faceKey => {
                  const count = combatGroup.rolls.filter(r => r === faceKey).length;
                  const label = faceTypeLabels[faceKey];
                  return (
                    <div key={faceKey} className="flex flex-col items-center p-2 rounded-md bg-muted/30 flex-1 min-w-0">
                      {/* <CombatDieFaceImage face={faceKey} size={32} className="mb-1" /> */}
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-lg font-bold text-primary">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
