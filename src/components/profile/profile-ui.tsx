
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Edit3, Save, LogOut, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AuthCredentials, SignUpCredentials } from '@/types/auth';

export function ProfileUI() {
  const { toast } = useToast();
  const { currentUser, loading, error, setError, signUp, login, logout } = useAuth(); // Use auth context

  const [isEditing, setIsEditing] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false); // To toggle between login and signup forms

  const [formData, setFormData] = useState<SignUpCredentials>({
    email: "",
    password: "",
    passwordConfirmation: "",
    displayName: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        password: "", // Clear password fields on user change
        passwordConfirmation: ""
      });
      setIsEditing(false); // Exit edit mode if user logs in/out
      setIsSigningUp(false); // Reset to login form
    } else {
      setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && currentUser) {
      setFormData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        password: "",
        passwordConfirmation: "",
      });
    }
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    // In a real app, this would call a function to update the user's profile in Firebase
    // For example, using updateProfile from 'firebase/auth' for displayName
    // and potentially a separate function to update email if that's allowed/implemented.
    // For now, we just simulate and update local state if needed.
    console.log("Saving changes (simulated):", { displayName: formData.displayName });
    // await updateProfile(currentUser, { displayName: formData.displayName }); // Example
    toast({
      title: "Profile Updated (Simulated)",
      description: "Your display name has been updated.",
    });
    setIsEditing(false);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const user = await login({ email, password });
    if (user) {
      toast({
        title: "Logged In Successfully!",
        description: `Welcome back, ${user.displayName || user.email}!`,
      });
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password, passwordConfirmation, displayName } = formData;
    if (!email || !password || !passwordConfirmation) {
      setError("Email, password, and password confirmation are required.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    const user = await signUp({ email, password, displayName });
    if (user) {
      toast({
        title: "Signed Up Successfully!",
        description: `Welcome, ${user.displayName || user.email}! You are now logged in.`,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl p-10 text-center">
        <CardTitle>Loading...</CardTitle>
        <CardDescription>Checking authentication status.</CardDescription>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <User className="mr-2" /> {isSigningUp ? "Create Account" : "User Profile"}
          </CardTitle>
          <CardDescription>
            {isSigningUp ? "Sign up to get started." : "Please log in to view and manage your profile."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" asChild>
          <form onSubmit={isSigningUp ? handleSignUp : handleLogin}>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            {isSigningUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirmation">Confirm Password</Label>
                  <Input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    value={formData.passwordConfirmation || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-4" disabled={loading}>
              {isSigningUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? "Processing..." : (isSigningUp ? "Sign Up" : "Log In")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => { setIsSigningUp(!isSigningUp); setError(null); }}>
            {isSigningUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Logged-in user view
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg">
          <AvatarImage src={currentUser.photoURL || `https://placehold.co/128x128.png`} alt={currentUser.displayName || "User"} data-ai-hint="user avatar placeholder" />
          <AvatarFallback className="text-4xl bg-muted">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl">{currentUser.displayName || currentUser.email || "User Profile"}</CardTitle>
        <CardDescription>Manage your account details and saved game data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div>
            <Label htmlFor="profileDisplayName">Display Name</Label>
            <Input
              id="profileDisplayName"
              name="displayName" // Ensure name matches formData key
              value={formData.displayName || ""}
              onChange={handleInputChange}
              disabled={!isEditing || loading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="profileEmail">Email Address</Label>
            <Input
              id="profileEmail"
              name="email" // Ensure name matches formData key
              type="email"
              value={formData.email || ""}
              readOnly // Email change usually requires re-authentication, keep it simple for now
              disabled 
              className="mt-1 bg-muted/50"
            />
          </div>
          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={handleEditToggle} disabled={loading}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={handleEditToggle} disabled={loading}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>
        </form>

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
           <Button variant="outline" className="w-full flex items-center justify-center" disabled>
            <ShieldCheck className="mr-2 h-4 w-4" /> Change Password (Placeholder)
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center justify-center" disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" /> {loading ? "Logging out..." : "Log Out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
