
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, LogOut, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const VALID_ACCESS_CODE = "BEAST_PARTY"; // For demonstration purposes only. Not secure.

export function SharedSpaceUI() {
  const [enteredCode, setEnteredCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinSession = () => {
    setIsLoading(true);
    // Simulate async operation
    setTimeout(() => {
      if (enteredCode === VALID_ACCESS_CODE) {
        setAccessGranted(true);
        setCurrentSessionCode(enteredCode);
        toast({
          title: 'Access Granted!',
          description: `You have joined the shared space: ${enteredCode}.`,
        });
      } else {
        toast({
          title: 'Access Denied',
          description: 'Invalid access code. Please try again.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
      setEnteredCode(''); // Clear input after attempt
    }, 500);
  };

  const handleLeaveSession = () => {
    setAccessGranted(false);
    setCurrentSessionCode(null);
    toast({
      title: 'Session Left',
      description: 'You have left the shared space.',
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Shared Space</CardTitle>
        </div>
        <CardDescription>
          {accessGranted ? `You are in session: ${currentSessionCode}` : 'Enter an access code to join a shared session.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!accessGranted ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="Enter code..."
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleJoinSession} className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || !enteredCode}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Joining...' : 'Join Session'}
            </Button>
          </div>
        ) : (
          <div>
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>Welcome to Session: {currentSessionCode}!</AlertTitle>
              <AlertDescription>
                This is a shared area. Real-time collaborative features would be implemented here.
                For now, this is a placeholder for shared content.
              </AlertDescription>
            </Alert>
            {/* Placeholder for shared content */}
            <div className="mt-6 p-4 border border-dashed rounded-md min-h-[200px] flex items-center justify-center text-muted-foreground">
              <p>Shared content area for session "{currentSessionCode}".</p>
            </div>
          </div>
        )}
      </CardContent>
      {accessGranted && (
        <CardFooter>
          <Button onClick={handleLeaveSession} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Leave Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
