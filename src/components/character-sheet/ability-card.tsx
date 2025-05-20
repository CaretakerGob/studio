
"use client";

import type { Ability } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Box, UserMinus, UserPlus } from 'lucide-react'; // Assuming UserMinus and UserPlus are available

export interface AbilityCardProps {
  ability: Ability;
  currentCooldown?: number;
  maxCooldown?: number;
  onIncrementCooldown?: () => void;
  onDecrementCooldown?: () => void;
  currentQuantity?: number;
  maxQuantity?: number;
  onIncrementQuantity?: () => void;
  onDecrementQuantity?: () => void;
}

export function AbilityCard({
  ability,
  currentCooldown, maxCooldown, onIncrementCooldown, onDecrementCooldown,
  currentQuantity, maxQuantity, onIncrementQuantity, onDecrementQuantity
}: AbilityCardProps) {

  const hasTrackableQuantity = ability.maxQuantity !== undefined &&
                               typeof currentQuantity === 'number' &&
                               typeof maxQuantity === 'number' &&
                               onIncrementQuantity &&
                               onDecrementQuantity;

  const hasTrackableCooldown = !hasTrackableQuantity && // Prioritize quantity display if both present
                               ability.cooldown &&
                               typeof currentCooldown === 'number' &&
                               typeof maxCooldown === 'number' &&
                               onIncrementCooldown &&
                               onDecrementCooldown;

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg text-primary">{ability.name}</CardTitle>
        {ability.details && <CardDescription className="text-xs">{ability.details}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{ability.description}</p>

        {hasTrackableQuantity && (
          <div className="mt-3 pt-3 border-t border-muted-foreground/20">
            <div className='flex justify-between items-center mb-1'>
              <Label htmlFor={`${ability.id}-quantity`} className="text-sm font-medium text-green-400 flex items-center">
                <Box className="mr-1 h-4 w-4" /> Charges
              </Label>
              {ability.maxQuantity && <span className="text-xs text-muted-foreground">(Max: {ability.maxQuantity})</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onDecrementQuantity} disabled={currentQuantity === 0} className="h-8 w-8">
                <UserMinus className="h-4 w-4" />
              </Button>
              <Input
                id={`${ability.id}-quantity`}
                type="number"
                value={currentQuantity}
                readOnly
                className="w-16 h-8 text-center text-lg font-bold"
              />
              <Button variant="outline" size="icon" onClick={onIncrementQuantity} disabled={currentQuantity === maxQuantity} className="h-8 w-8">
                <UserPlus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-medium text-muted-foreground">/ {maxQuantity}</span>
            </div>
          </div>
        )}

        {hasTrackableCooldown && (
          <div className="mt-3 pt-3 border-t border-muted-foreground/20">
            <div className='flex justify-between items-center mb-1'>
              <Label htmlFor={`${ability.id}-cooldown`} className="text-sm font-medium text-amber-400 flex items-center">
                <Clock className="mr-1 h-4 w-4" /> Current Cooldown
              </Label>
               {ability.cooldown && <span className="text-xs text-muted-foreground">({ability.cooldown})</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onDecrementCooldown} disabled={currentCooldown === 0} className="h-8 w-8">
                <UserMinus className="h-4 w-4" />
              </Button>
              <Input
                id={`${ability.id}-cooldown`}
                type="number"
                value={currentCooldown}
                readOnly
                className="w-16 h-8 text-center text-lg font-bold"
              />
              <Button variant="outline" size="icon" onClick={onIncrementCooldown} disabled={currentCooldown === maxCooldown} className="h-8 w-8">
                <UserPlus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-medium text-muted-foreground">/ {maxCooldown}</span>
            </div>
          </div>
        )}

        {!hasTrackableQuantity && !hasTrackableCooldown && ability.cooldown && (
          <p className="text-xs text-amber-400 mt-1 flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Cooldown: {ability.cooldown}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
