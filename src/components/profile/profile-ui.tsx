
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, ShieldCheck, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SignUpCredentials } from '@/types/auth';
import { auth, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { AuthForm } from './auth-form';
import { UserProfileDisplay } from './user-profile-display';
import { EditProfileForm } from './edit-profile-form';

export function ProfileUI() {
  const { toast } = useToast();
  const { currentUser, loading: authLoading, error: authError, setError: setAuthError, signUp, login, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [formData, setFormData] = useState<SignUpCredentials>({
    email: "",
    password: "",
    passwordConfirmation: "",
    displayName: "",
  });
  const [editFormData, setEditFormData] = useState<{ displayName: string }>({ displayName: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({ email: currentUser.email || "", password: "", passwordConfirmation: "", displayName: currentUser.displayName || "" });
      setEditFormData({ displayName: currentUser.displayName || "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
      setIsSigningUp(false); // Ensure not in signup mode if logged in
    } else {
      // Reset for logged-out state
      setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
      setEditFormData({ displayName: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsSigningUp(false); // Default to login form
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (authError) setAuthError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
        setSelectedFile(null);
        setPreviewUrl(null);
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && currentUser) { // When entering edit mode
      setEditFormData({ displayName: currentUser.displayName || "" });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (currentUser) {
      setEditFormData({ displayName: currentUser.displayName || "" });
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !auth.currentUser) {
      setAuthError("Not authenticated. Please log in again.");
      return;
    }

    setIsUploading(true);
    if(setAuthError) setAuthError(null);
    let newPhotoURL = currentUser.photoURL;
    let displayNameChanged = editFormData.displayName !== (currentUser.displayName || "");

    try {
      if (selectedFile) {
        const fileRef = storageRef(storage, `profileImages/${currentUser.uid}/${selectedFile.name}`);
        await uploadBytes(fileRef, selectedFile);
        newPhotoURL = await getDownloadURL(fileRef);
        toast({ title: "Profile Image Updated", description: "Your new profile image has been saved." });
      }

      if (displayNameChanged || (selectedFile && newPhotoURL !== currentUser.photoURL)) {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (displayNameChanged) {
          profileUpdates.displayName = editFormData.displayName;
        }
        if (selectedFile && newPhotoURL) {
          profileUpdates.photoURL = newPhotoURL;
        }
        
        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile(auth.currentUser, profileUpdates);
          if (displayNameChanged && !selectedFile) {
             toast({ title: "Display Name Updated", description: "Your display name has been saved." });
          } else if (!displayNameChanged && selectedFile) {
            // Toast for image update already shown
          } else if (displayNameChanged && selectedFile) {
            toast({ title: "Profile Updated", description: "Display name and image saved." });
          }
        }
      }
      
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (uploadError: any) {
      console.error("Error updating profile:", uploadError);
      if(setAuthError) setAuthError(uploadError.message || "Failed to update profile.");
      toast({ title: "Update Failed", description: uploadError.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      if(setAuthError) setAuthError("Email and password are required.");
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

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password, passwordConfirmation, displayName } = formData;
    if (!email || !password || !passwordConfirmation) {
      if(setAuthError) setAuthError("Email, password, and password confirmation are required.");
      return;
    }
    if (password !== passwordConfirmation) {
      if(setAuthError) setAuthError("Passwords do not match.");
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
  
  const toggleSignUpMode = () => {
    setIsSigningUp(!isSigningUp);
    setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" }); // Reset form
    if(setAuthError) setAuthError(null); // Clear errors
  };

  if (authLoading && !currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl p-10 text-center">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Checking authentication status.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        {!currentUser ? (
          <>
            <CardTitle className="text-2xl flex items-center justify-center">
              <User className="mr-2" /> {isSigningUp ? "Create Account" : "User Log In"}
            </CardTitle>
            <CardDescription>
              {isSigningUp ? "Sign up to save your progress." : "Log in to access your profile."}
            </CardDescription>
          </>
        ) : (
          <>
            <CardTitle className="text-3xl">{editFormData.displayName || currentUser.displayName || currentUser.email || "User Profile"}</CardTitle>
            <CardDescription>Manage your account details and saved game data.</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentUser ? (
          <AuthForm
            isSigningUp={isSigningUp}
            formData={formData}
            handleInputChange={handleInputChange}
            handleLoginSubmit={handleLoginSubmit}
            handleSignUpSubmit={handleSignUpSubmit}
            loading={authLoading}
            error={authError}
            toggleSignUpMode={toggleSignUpMode}
          />
        ) : isEditing ? (
          <EditProfileForm
            currentUser={currentUser}
            formData={editFormData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            handleSaveChanges={handleSaveChanges}
            handleCancelEdit={handleCancelEdit}
            isUploading={isUploading}
            loading={authLoading}
            previewUrl={previewUrl}
            selectedFile={selectedFile}
          />
        ) : (
          <UserProfileDisplay
            currentUser={currentUser}
            handleEditToggle={handleEditToggle}
          />
        )}

        {currentUser && !isEditing && (
          <>
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
              <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center justify-center" disabled={isUploading || authLoading}>
                <LogOut className="mr-2 h-4 w-4" /> {authLoading ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
      {!currentUser && (
        <CardFooter className="flex justify-center">
          {/* This toggle is now part of AuthForm */}
        </CardFooter>
      )}
    </Card>
  );
}
