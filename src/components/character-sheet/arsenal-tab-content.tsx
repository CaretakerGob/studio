
"use client";

import type { Character } from '@/types/character';
import type { ArsenalCard, ArsenalItem, ArsenalItemCategory } from '@/types/arsenal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Package, AlertCircle, PawPrint, UserCircle, UserMinus, UserPlus } from 'lucide-react';

interface ArsenalTabContentProps {
  editableCharacterData: Character;
  arsenalCards: ArsenalCard[];
  handleArsenalCardChange: (arsenalCardId: string | undefined) => void;
  currentCompanion: ArsenalItem | null; // Receives the current companion
  // The following props related to detailed pet stats are no longer needed here
  // as the primary interactive display is now in CharacterSheetUI's "stats" tab.
  // We can still display basic pet info if `currentCompanion` is passed.
  // currentPetHp: number | null;
  // currentPetSanity: number | null;
  // handleIncrementPetStat: (statType: 'hp' | 'sanity') => void;
  // handleDecrementPetStat: (statType: 'hp' | 'sanity') => void;
  criticalArsenalError?: ArsenalCard | null;
}

export function ArsenalTabContent({
  editableCharacterData,
  arsenalCards,
  handleArsenalCardChange,
  currentCompanion, // Keep this to know if a pet is part of the arsenal
  // currentPetHp, // No longer needed for detailed display here
  // currentPetSanity, // No longer needed for detailed display here
  // handleIncrementPetStat, // No longer needed here
  // handleDecrementPetStat, // No longer needed here
  criticalArsenalError,
}: ArsenalTabContentProps) {

  const equippedArsenalCard = arsenalCards.find(card => card.id === editableCharacterData.selectedArsenalCardId) || null;

  const renderArsenalItemsByCategory = (category: ArsenalItemCategory) => {
    if (!equippedArsenalCard) return null;
    const items = equippedArsenalCard.items.filter(item => item.category?.toUpperCase() === category.toUpperCase());
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No {category.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} items in this arsenal.</p>;
    }
    return (
      <ScrollArea className="h-[250px] pr-3">
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-3 bg-card/60 border-muted-foreground/20">
              <div className="font-semibold text-foreground">
                {item.abilityName || 'Unnamed Item'}
                {item.class ? ` (${item.class})` : ''}
                 {item.level !== undefined ? <Badge variant="secondary" className="ml-2 text-xs">Lvl {item.level}</Badge> : ''}
              </div>
              {item.itemDescription && <p className="text-xs text-muted-foreground">{item.itemDescription}</p>}
              {item.parsedWeaponStats?.attack !== undefined && (
                <p className="text-xs"><span className="font-medium text-primary/80">Attack:</span> {item.parsedWeaponStats.attack}
                {item.parsedWeaponStats?.range !== undefined && <span className="ml-2"><span className="font-medium text-primary/80">Range:</span> {item.parsedWeaponStats.range}</span>}
                </p>
              )}
              {item.effect && <p className="text-xs"><span className="font-medium text-primary/80">Effect:</span> {item.effect}</p>}
              {item.secondaryEffect && <p className="text-xs"><span className="font-medium text-primary/80">Secondary:</span> {item.secondaryEffect}</p>}
              {item.parsedStatModifiers && item.parsedStatModifiers.length > 0 && (
                <p className="text-xs"><span className="font-medium text-primary/80">Stat Changes:</span> {item.parsedStatModifiers.map(mod => `${mod.targetStat.toUpperCase()}: ${mod.value > 0 ? '+' : ''}${mod.value}`).join(', ')}</p>
              )}
              {item.isPet && currentCompanion?.id === item.id && ( // Show basic pet info here
                <div className="mt-2 pt-2 border-t border-muted-foreground/30 text-xs">
                  <p className="font-medium text-primary flex items-center"><PawPrint className="mr-1 h-4 w-4" /> Companion: {item.petName || item.abilityName || 'Companion'}</p>
                  {item.petStats && <p><strong className="text-muted-foreground">Stats:</strong> {item.petStats}</p>}
                  {item.petAbilities && <p><strong className="text-muted-foreground">Abilities:</strong> {item.petAbilities}</p>}
                </div>
              )}
              {item.qty && <p className="text-xs"><span className="font-medium text-primary/80">Qty:</span> {item.qty}</p>}
              {item.cd && <p className="text-xs"><span className="font-medium text-primary/80">CD:</span> {item.cd}</p>}
              {item.type && <p className="text-xs"><span className="font-medium text-primary/80">Type:</span> {item.type}</p>}
              {item.toggle !== undefined && <p className="text-xs"><span className="font-medium text-primary/80">Toggle:</span> {item.toggle ? 'Yes' : 'No'}</p>}
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-2 p-4 border border-dashed border-accent/50 rounded-lg bg-card/30">
      <Label htmlFor="arsenalCardSelect" className="text-lg font-medium text-accent flex items-center">
        <Package className="mr-2 h-5 w-5" /> Arsenal Loadout
      </Label>
      {criticalArsenalError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{criticalArsenalError.name}</AlertTitle>
          <AlertDescription>
            {criticalArsenalError.description}
            {criticalArsenalError.items?.length > 0 && criticalArsenalError.items[0].abilityName && ` Headers Found: [${criticalArsenalError.items[0].abilityName}]`}
          </AlertDescription>
        </Alert>
      )}
      <Select
        value={editableCharacterData.selectedArsenalCardId || "none"}
        onValueChange={handleArsenalCardChange}
        disabled={!arsenalCards || arsenalCards.length === 0 || (arsenalCards.length === 1 && (arsenalCards[0].id.startsWith('error-') || arsenalCards[0].id.startsWith('warning-')))}
      >
        <SelectTrigger id="arsenalCardSelect">
          <SelectValue placeholder="Select Arsenal Loadout..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {arsenalCards.filter(card => !card.id.startsWith('error-') && !card.id.startsWith('warning-')).map(card => (
            <SelectItem key={card.id} value={card.id}>
              {card.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {equippedArsenalCard && (
        <Card className="mt-2 p-3 bg-card/60 border-accent/70">
          <CardTitle className="text-md text-accent mb-2">{equippedArsenalCard.name}</CardTitle>
          {equippedArsenalCard.description && <CardDescription className="text-xs mt-1 mb-2">{equippedArsenalCard.description}</CardDescription>}
          
          {/* The detailed, interactive pet stats display is now in CharacterSheetUI's "stats" tab. */}
          {/* We can show a simple mention if the current arsenal includes the active companion. */}
          {currentCompanion && equippedArsenalCard.items.some(item => item.id === currentCompanion.id) && (
             <div className="my-2 p-2 border border-muted-foreground/20 rounded-md bg-background/30 text-sm">
                <p className="flex items-center text-primary"><PawPrint className="mr-2 h-4 w-4" />Includes Companion: {currentCompanion.petName || currentCompanion.abilityName}</p>
                {/* Optionally display raw stats or abilities string here if desired, but no trackers */}
                {currentCompanion.petStats && <p className="text-xs text-muted-foreground">Base Stats: {currentCompanion.petStats}</p>}
             </div>
          )}

          <Separator className="my-3" />
          <div>
            <h4 className="text-md font-semibold mb-2 text-accent">Load Out Items:</h4>
            {renderArsenalItemsByCategory('LOAD OUT')}
          </div>
           <Separator className="my-3" />
           <div>
            <h4 className="text-md font-semibold mb-2 text-accent">Bonus Items:</h4>
            {renderArsenalItemsByCategory('BONUS')}
          </div>
           <Separator className="my-3" />
           <div>
            <h4 className="text-md font-semibold mb-2 text-accent">Elite Items:</h4>
            {renderArsenalItemsByCategory('ELITE')}
          </div>
          <Separator className="my-3" />
          <div className="mt-3 text-xs space-y-0.5">
              <p className="font-medium text-muted-foreground">Global Stat Modifiers (from Arsenal Card itself):</p>
              {equippedArsenalCard.hpMod !== 0 && typeof equippedArsenalCard.hpMod === 'number' && <p>HP Mod: {equippedArsenalCard.hpMod?.toFixed(0)}</p>}
              {equippedArsenalCard.maxHpMod !== 0 && typeof equippedArsenalCard.maxHpMod === 'number' && <p>Max HP Mod: {equippedArsenalCard.maxHpMod?.toFixed(0)}</p>}
              {equippedArsenalCard.mvMod !== 0 && typeof equippedArsenalCard.mvMod === 'number' && <p>MV Mod: {equippedArsenalCard.mvMod?.toFixed(0)}</p>}
              {equippedArsenalCard.defMod !== 0 && typeof equippedArsenalCard.defMod === 'number' && <p>DEF Mod: {equippedArsenalCard.defMod?.toFixed(0)}</p>}
              {equippedArsenalCard.sanityMod !== 0 && typeof equippedArsenalCard.sanityMod === 'number' && <p>Sanity Mod: {equippedArsenalCard.sanityMod?.toFixed(0)}</p>}
              {equippedArsenalCard.maxSanityMod !== 0 && typeof equippedArsenalCard.maxSanityMod === 'number' && <p>Max Sanity Mod: {equippedArsenalCard.maxSanityMod?.toFixed(0)}</p>}
              {equippedArsenalCard.meleeAttackMod !== 0 && typeof equippedArsenalCard.meleeAttackMod === 'number' && <p>Melee Attack Mod: {equippedArsenalCard.meleeAttackMod?.toFixed(0)}</p>}
              {equippedArsenalCard.rangedAttackMod !== 0 && typeof equippedArsenalCard.rangedAttackMod === 'number' && <p>Ranged Attack Mod: {equippedArsenalCard.rangedAttackMod?.toFixed(0)}</p>}
              {equippedArsenalCard.rangedRangeMod !== 0 && typeof equippedArsenalCard.rangedRangeMod === 'number' && <p>Ranged Range Mod: {equippedArsenalCard.rangedRangeMod?.toFixed(0)}</p>}
               {![equippedArsenalCard.hpMod, equippedArsenalCard.maxHpMod, equippedArsenalCard.mvMod, equippedArsenalCard.defMod, equippedArsenalCard.sanityMod, equippedArsenalCard.maxSanityMod, equippedArsenalCard.meleeAttackMod, equippedArsenalCard.rangedAttackMod, equippedArsenalCard.rangedRangeMod].some(mod => mod && mod !== 0) && (
                  <p className="italic">No global stat modifiers.</p>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}

    