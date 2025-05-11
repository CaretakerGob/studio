"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, Play, RotateCcw, ArrowRightCircle, VenetianMask } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface Player {
  id: string;
  name: string;
  avatarSeed: string; // For picsum avatar
}

const initialPlayers: Player[] = [
  { id: '1', name: 'Player 1', avatarSeed: 'player1' },
  { id: '2', name: 'Beast', avatarSeed: 'beast😈' },
];

export function TurnTrackerUI() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const { toast } = useToast();

  const addPlayer = () => {
    if (newPlayerName.trim() === '') {
      toast({ title: "Error", description: "Player name cannot be empty.", variant: "destructive" });
      return;
    }
    if (players.length >= 8) { // Arbitrary limit
        toast({ title: "Limit Reached", description: "Maximum of 8 players allowed.", variant: "destructive" });
        return;
    }
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatarSeed: newPlayerName.trim().toLowerCase().replace(/\s/g, '') + Date.now(),
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    toast({ title: "Player Added", description: `${newPlayer.name} has joined the hunt.` });
  };

  const removePlayer = (id: string) => {
    const playerToRemove = players.find(p => p.id === id);
    setPlayers(players.filter(player => player.id !== id));
    if (players.length -1 <= currentTurnIndex && currentTurnIndex > 0) {
      setCurrentTurnIndex(prev => Math.max(0, prev -1));
    }
    toast({ title: "Player Removed", description: `${playerToRemove?.name} has left the game.`, variant: "destructive" });
  };

  const nextTurn = () => {
    if (players.length === 0) return;
    setCurrentTurnIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % players.length;
      if (nextIndex === 0) {
        setRound(prevRound => prevRound + 1);
         toast({ title: "New Round!", description: `Round ${round + 1} begins.`});
      }
      return nextIndex;
    });
  };
  
  const resetTracker = () => {
    setPlayers(initialPlayers);
    setCurrentTurnIndex(0);
    setRound(1);
    setNewPlayerName('');
    toast({ title: "Tracker Reset", description: "The turn order and players have been reset." });
  }

  const currentPlayer = players[currentTurnIndex];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <UserPlus className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Manage Players</CardTitle>
          </div>
          <CardDescription>Add or remove players from the game.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            />
            <Button onClick={addPlayer}><UserPlus className="h-4 w-4" /></Button>
          </div>
          <Separator />
          <ScrollArea className="h-[200px] pr-3"> {/* Adjust height as needed */}
            {players.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No players added yet.</p>
            ) : (
            <ul className="space-y-2">
              {players.map((player, index) => (
                <li key={player.id} className="flex items-center justify-between p-2 rounded-md bg-card/50 hover:bg-muted/50">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={`https://picsum.photos/seed/${player.avatarSeed}/40/40`} alt={player.name} data-ai-hint="player avatar" />
                      <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePlayer(player.id)} className="text-destructive hover:text-destructive/80 h-7 w-7">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={resetTracker} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Tracker
            </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Users className="mr-3 h-10 w-10 text-primary" />
                <CardTitle className="text-3xl">Turn Tracker</CardTitle>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">Round: {round}</Badge>
          </div>
          <CardDescription>Keep track of whose turn it is. The hunt continues!</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6 min-h-[250px] flex flex-col justify-center items-center">
          {players.length === 0 ? (
             <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <AlertTitle>No Players</AlertTitle>
              <AlertDescription>
                Add some players to start tracking turns.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-xl text-muted-foreground">Current Turn:</p>
              <div className="flex flex-col items-center p-6 rounded-lg bg-primary/10 border border-primary shadow-md animate-in fade-in duration-500">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                  <AvatarImage src={`https://picsum.photos/seed/${currentPlayer.avatarSeed}/100/100`} alt={currentPlayer.name} data-ai-hint="current player"/>
                  <AvatarFallback className="text-3xl bg-primary/30 text-primary-foreground">
                    {currentPlayer.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-4xl font-bold text-primary">{currentPlayer.name}</h3>
              </div>
              <Button onClick={nextTurn} size="lg" className="w-full max-w-xs text-lg bg-primary hover:bg-primary/90">
                <ArrowRightCircle className="mr-2 h-6 w-6" /> Next Turn
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="pt-6">
            <div className="w-full text-xs text-muted-foreground">
                Next up: {players.length > 0 ? players[(currentTurnIndex + 1) % players.length]?.name || 'N/A' : 'N/A'}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
