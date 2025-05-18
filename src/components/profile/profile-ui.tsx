
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Edit3, Save, ShieldCheck, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Placeholder for user data structure
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string;
}

export function ProfileUI() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Placeholder: In a real app, this would come from your authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    uid: "placeholder-uid-123",
    email: "user@example.com",
    displayName: "Beast Hunter",
    avatarUrl: "https://placehold.co/128x128.png"
  });

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    email: currentUser?.email || "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && currentUser) { // Reset form data if canceling edit
        setFormData({
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
        });
    }
  };

  const handleSaveChanges = () => {
    // Placeholder: In a real app, this would update the user's profile in Firebase Auth/Firestore
    console.log("Saving changes:", formData);
    setCurrentUser(prev => prev ? ({ ...prev, displayName: formData.displayName, email: formData.email }) : null);
    setIsEditing(false);
    toast({
      title: "Profile Updated (Simulated)",
      description: "Your profile information has been updated.",
    });
  };

  const handleLogout = () => {
    // Placeholder: In a real app, this would sign the user out using Firebase Auth
    console.log("User logged out (Simulated)");
    setCurrentUser(null); // Simulate logout
    toast({
      title: "Logged Out (Simulated)",
      description: "You have been successfully logged out.",
    });
  };

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><User className="mr-2" /> User Profile</CardTitle>
          <CardDescription>Please log in to view your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-primary hover:bg-primary/90">
            Log In (Placeholder)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg">
          <AvatarImage src={currentUser.avatarUrl || `https://placehold.co/128x128.png`} alt={currentUser.displayName || "User"} data-ai-hint="user avatar placeholder" />
          <AvatarFallback className="text-4xl bg-muted">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl">{currentUser.displayName || "User Profile"}</CardTitle>
        <CardDescription>Manage your account details and saved game data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              disabled={!isEditing} 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleInputChange} 
              disabled={!isEditing} // Or always disabled if email is not editable
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleEditToggle}>Cancel</Button>
              <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary">Saved Data (Placeholder)</h3>
          <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground bg-card/50">
            <p>Your saved custom characters and other game data will appear here.</p>
            <Button variant="outline" className="mt-3" disabled>
              Manage Saved Characters (Coming Soon)
            </Button>
          </div>
        </div>
        
        <Separator />

        <div className="space-y-3">
           <Button variant="outline" className="w-full flex items-center justify-center">
            <ShieldCheck className="mr-2 h-4 w-4" /> Change Password (Placeholder)
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center justify-center">
            <LogOut className="mr-2 h-4 w-4" /> Log Out (Placeholder)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
