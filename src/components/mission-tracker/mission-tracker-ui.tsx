
"use client";

import { useState, useEffect } from 'react';
import type { Enemy, ActiveEnemy } from '@/types/mission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Map, ShieldAlert, UserPlus, UserMinus, Trash2, PlayCircle, Crosshair, Zap, Brain, Heart } from 'lucide-react';

interface MissionTrackerUIProps {
  initialEnemies: Enemy[];
}

export function MissionTrackerUI({ initialEnemies }: MissionTrackerUIProps) {
  const [enemiesList, setEnemiesList] = useState<Enemy[]>(initialEnemies);
  const [selectedEnemyIdToAdd, setSelectedEnemyIdToAdd] = useState<string | undefined>(undefined);
  const [activeEnemies, setActiveEnemies] = useState<ActiveEnemy[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setEnemiesList(initialEnemies);
  }, [initialEnemies]);

  const handleAddEnemyToEncounter = () => {
    if (!selectedEnemyIdToAdd) {
      toast({ title: "No Enemy Selected", description: "Please select an enemy from the list.", variant: "destructive" });
      return;
    }
    const enemyTemplate = enemiesList.find(e => e.id === selectedEnemyIdToAdd);
    if (!enemyTemplate) {
      toast({ title: "Error", description: "Selected enemy template not found.", variant: "destructive" });
      return;
    }

    const newActiveEnemy: ActiveEnemy = {
      ...enemyTemplate,
      instanceId: `${enemyTemplate.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      currentHp: enemyTemplate.baseStats.hp || 10, // Default to 10 if HP undefined
      currentSanity: enemyTemplate.baseStats.san, // Optional for now
    };

    setActiveEnemies(prev => [...prev, newActiveEnemy]);
    toast({ title: "Enemy Added", description: `${enemyTemplate.name} added to the encounter.` });
    setSelectedEnemyIdToAdd(undefined); // Reset selection
  };

  const handleEnemyStatChange = (instanceId: string, stat: 'hp' | 'san', delta: number) => {
    setActiveEnemies(prev => prev.map(enemy => {
      if (enemy.instanceId === instanceId) {
        if (stat === 'hp') {
          const newHp = Math.max(0, (enemy.currentHp || 0) + delta);
          return { ...enemy, currentHp: newHp };
        }
        // Add sanity handling if/when needed
      }
      return enemy;
    }));
  };

  const handleRemoveEnemyFromEncounter = (instanceId: string) => {
    const enemyToRemove = activeEnemies.find(e => e.instanceId === instanceId);
    setActiveEnemies(prev => prev.filter(enemy => enemy.instanceId !== instanceId));
    if(enemyToRemove) {
        toast({ title: "Enemy Removed", description: `${enemyToRemove.name} removed from encounter.`, variant: "destructive" });
    }
  };
  
  if (initialEnemies.length === 0 && !initialEnemies.find(e => e.id === 'parser-error-indicator')) {
     // Check if it's not the specific error indicator from a failed parse
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mission Tracker Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">Failed to load enemy data from the Horror Journal. Please check the file and server logs.</p>
            </CardContent>
        </Card>
    );
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/* Mission Setup & Enemy Selection */}
      <Card className="lg:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <Map className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Mission Setup</CardTitle>
          </div>
          <CardDescription>Configure your mission and add enemies to the encounter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder for Hunt Selection / Mission Details */}
          <div className="p-4 border rounded-md bg-muted/30">
            <h4 className="font-semibold text-lg mb-2">Current Hunt/Objective</h4>
            <p className="text-sm text-muted-foreground"> (Hunt selection and objective tracking will be added here.)</p>
          </div>
          
          <Separator />

          <div>
            <Label htmlFor="enemy-select" className="text-md font-medium">Add Enemy to Encounter</Label>
            <div className="flex items-center gap-2 mt-1">
              <Select value={selectedEnemyIdToAdd} onValueChange={setSelectedEnemyIdToAdd}>
                <SelectTrigger id="enemy-select" className="flex-grow">
                  <SelectValue placeholder="Select an enemy..." />
                </SelectTrigger>
                <SelectContent>
                  {enemiesList.sort((a,b) => a.name.localeCompare(b.name)).map(enemy => (
                    <SelectItem key={enemy.id} value={enemy.id}>
                      {enemy.name} (CP: {enemy.cp || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddEnemyToEncounter} disabled={!selectedEnemyIdToAdd}>
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Encounter Section */}
      <Card className="lg:col-span-2 shadow-xl">
        <CardHeader>
           <div className="flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Active Encounter</CardTitle>
          </div>
          <CardDescription>Manage enemies currently in combat.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnemies.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No enemies in the current encounter. Add some from the setup panel.</p>
          ) : (
            <ScrollArea className="h-[60vh] pr-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEnemies.map(enemy => (
                  <Card key={enemy.instanceId} className="bg-card/50 border-border relative group">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-primary">{enemy.name}</CardTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveEnemyFromEncounter(enemy.instanceId)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs">
                        CP: {enemy.cp || 'N/A'} | Template: {enemy.template || 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`hp-${enemy.instanceId}`} className="flex items-center text-sm">
                            <Heart className="mr-1.5 h-4 w-4 text-red-500" /> HP:
                        </Label>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'hp', -1)}><UserMinus className="h-3 w-3" /></Button>
                          <Input id={`hp-${enemy.instanceId}`} type="number" value={enemy.currentHp} readOnly className="w-12 h-6 text-center text-sm" />
                           <span className="text-sm text-muted-foreground">/ {enemy.baseStats.hp || 'N/A'}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEnemyStatChange(enemy.instanceId, 'hp', 1)}><UserPlus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      {/* Basic Stats Display */}
                      <div className="grid grid-cols-3 gap-x-2 text-xs border-t pt-2 mt-2">
                        <p><Zap className="inline h-3 w-3 mr-1 text-yellow-400"/>MV: {enemy.baseStats.mv || 'N/A'}</p>
                        <p><ShieldAlert className="inline h-3 w-3 mr-1 text-gray-400"/>DEF: {enemy.baseStats.def || 'N/A'}</p>
                        {enemy.baseStats.san !== undefined && <p><Brain className="inline h-3 w-3 mr-1 text-blue-400"/>SAN: {enemy.baseStats.san}</p>}
                      </div>
                      {enemy.baseStats.armor && (
                        <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium">Armor: {enemy.baseStats.armor.name}</p>
                            <p className="text-muted-foreground">Effect: {enemy.baseStats.armor.effect}</p>
                        </div>
                      )}
                       {enemy.baseAttacks.length > 0 && (
                        <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium">Base Attacks:</p>
                            {enemy.baseAttacks.map((atk, idx) => (
                                <p key={idx} className="text-muted-foreground">
                                    <Crosshair className="inline h-3 w-3 mr-1 text-green-400"/> {atk.type}: {atk.details}
                                </p>
                            ))}
                        </div>
                       )}
                       {enemy.logic && (
                        <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium">Logic: <span className="text-muted-foreground">{enemy.logic.condition}</span></p>
                        </div>
                       )}
                       {/* Placeholder for detailed abilities view button */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

       {/* Placeholder for Card Decks / Game State Section */}
       {/* <Card className="lg:col-span-3 shadow-xl">
            <CardHeader><CardTitle>Game State & Card Decks</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">(Card deck interactions and global game state will be managed here.)</p></CardContent>
       </Card> */}
    </div>
  );
}
