
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, ShieldCheck, LogOut, Edit3, ListChecks, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SignUpCredentials } from '@/types/auth';
import type { Character } from '@/types/character';
import { charactersData } from '@/components/character-sheet/character-sheet-ui'; // Import charactersData
import { auth, storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";


import { AuthForm } from './auth-form';
import { UserProfileDisplay } from './user-profile-display';
import { EditProfileForm } from './edit-profile-form';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export function ProfileUI() {
  const { toast } = useToast();
  const { currentUser, loading: authLoading, error: authError, setError: setAuthError, signUp, login, logout } = useAuth();
  const router = useRouter();

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

  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [isLoadingSavedChars, setIsLoadingSavedChars] = useState(false);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);

  // State for Rename Dialog
  const [characterToRename, setCharacterToRename] = useState<Character | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false);


  useEffect(() => {
    if (currentUser) {
      setFormData({ email: currentUser.email || "", password: "", passwordConfirmation: "", displayName: currentUser.displayName || "" });
      setEditFormData({ displayName: currentUser.displayName || "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
      setIsSigningUp(false);
      fetchSavedCharacters();
    } else {
      setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
      setEditFormData({ displayName: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsSigningUp(false);
      setSavedCharacters([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchSavedCharacters = async () => {
    if (!currentUser || !auth.currentUser) return;
    setIsLoadingSavedChars(true);
    try {
      const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
      const querySnapshot = await getDocs(charactersCollectionRef);
      const chars = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Character));
      setSavedCharacters(chars.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));
    } catch (err) {
      console.error("Error fetching saved characters for profile:", err);
      toast({ title: "Load Error", description: "Could not fetch your saved characters.", variant: "destructive" });
      setSavedCharacters([]);
    } finally {
      setIsLoadingSavedChars(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (authError && setAuthError) setAuthError(null);
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
    if (!isEditing && currentUser) {
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
      if (setAuthError) setAuthError("Not authenticated. Please log in again.");
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

        if (Object.keys(profileUpdates).length > 0 && auth.currentUser) {
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
    setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
    if(setAuthError) setAuthError(null);
  };

  const handleLoadCharacter = (characterId: string) => {
    router.push(`/character-sheet?load=${characterId}`);
    toast({ title: "Loading Character", description: `Attempting to load character ${characterId}...` });
  };

  const openRenameDialog = (char: Character) => {
    setCharacterToRename(char);
    setRenameInputValue(char.name || "");
    setIsRenameDialogOpen(true);
  };

  const handleRenameCharacter = async () => {
    if (!characterToRename || !currentUser || !auth.currentUser || !renameInputValue.trim()) {
      toast({ title: "Error", description: "Character or new name is missing.", variant: "destructive" });
      return;
    }

    const characterRef = doc(db, "userCharacters", auth.currentUser.uid, "characters", characterToRename.id);
    try {
      await updateDoc(characterRef, {
        name: renameInputValue.trim(),
        lastSaved: new Date().toISOString(),
      });
      toast({ title: "Character Renamed", description: `${characterToRename.name} successfully renamed to ${renameInputValue.trim()}.` });
      setSavedCharacters(prev =>
        prev.map(c =>
          c.id === characterToRename.id ? { ...c, name: renameInputValue.trim(), lastSaved: new Date().toISOString() } : c
        ).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
      );
      setIsRenameDialogOpen(false);
      setCharacterToRename(null);
    } catch (err) {
      console.error("Error renaming character:", err);
      toast({ title: "Rename Failed", description: "Could not rename character.", variant: "destructive" });
    }
  };


  const confirmDeleteCharacter = async () => {
    if (!charToDelete || !currentUser || !auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "userCharacters", auth.currentUser.uid, "characters", charToDelete.id));
      toast({ title: "Character Deleted", description: `${charToDelete.name || charToDelete.id} has been deleted.` });
      setSavedCharacters(prev => prev.filter(c => c.id !== charToDelete.id));
    } catch (err) {
      console.error("Error deleting character:", err);
      toast({ title: "Delete Failed", description: "Could not delete character.", variant: "destructive" });
    }
    setCharToDelete(null);
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
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
                <ListChecks className="mr-2 h-5 w-5" /> Manage Saved Characters
              </h3>
              {isLoadingSavedChars ? (
                 <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                 </div>
              ) : savedCharacters.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {savedCharacters.map(char => {
                    const baseTemplate = charactersData.find(c => c.id === char.id);
                    let finalDisplayName = char.name || `Character ID: ${char.id}`;

                    if (char.id === 'custom') {
                        const customTemplateName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";
                        if (char.name && char.name !== customTemplateName) {
                            finalDisplayName = `${char.name} (Custom Character)`;
                        } else {
                            finalDisplayName = "Custom Character";
                        }
                    } else if (baseTemplate) {
                        if (char.name && char.name !== baseTemplate.name) {
                            finalDisplayName = `${char.name} (${baseTemplate.name})`;
                        } else {
                            finalDisplayName = baseTemplate.name;
                        }
                    } else if (char.id !== 'custom') {
                        // Fallback for template not found, unlikely if charactersData is complete
                        finalDisplayName = `${char.name || char.id} (${char.id.charAt(0).toUpperCase() + char.id.slice(1)})`;
                    }

                    const avatarSrc = char.imageUrl || baseTemplate?.imageUrl || `https://placehold.co/40x40.png`;
                    const avatarFallback = (char.name || char.id).substring(0, 2).toUpperCase();
                    const lastSavedDate = char.lastSaved ? new Date(char.lastSaved).toLocaleDateString() : "Not available";

                    return (
                      <Card key={char.id} className="p-3 bg-card/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarSrc} alt={char.name || char.id} data-ai-hint="character avatar" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{finalDisplayName}</p>
                            <p className="text-xs text-muted-foreground">
                              Last Saved: {lastSavedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleLoadCharacter(char.id)}>
                            <Eye className="mr-1 h-4 w-4" /> Load
                          </Button>
                           <Button variant="outline" size="sm" onClick={() => openRenameDialog(char)}>
                            <Edit3 className="mr-1 h-4 w-4" /> Rename
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setCharToDelete(char)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Alert variant="default" className="border-dashed">
                  <AlertTitle>No Saved Characters</AlertTitle>
                  <AlertDescription>You haven&apos;t saved any characters yet. Go to the Character Sheet to save one!</AlertDescription>
                </Alert>
              )}
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
       <AlertDialog open={!!charToDelete} onOpenChange={(open) => !open && setCharToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the character
              <span className="font-semibold"> {charToDelete?.name || charToDelete?.id}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCharToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCharacter} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Yes, delete character
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Character Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Character: {characterToRename?.name || characterToRename?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="renameCharacterInput">New Name</Label>
            <Input
              id="renameCharacterInput"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder={characterToRename?.id === 'custom' ? "Enter new character name" : "Enter new name for this template"}
            />
            {characterToRename?.id !== 'custom' && baseTemplateName(characterToRename?.id) && (
                 <p className="text-xs text-muted-foreground">
                    Original template: {baseTemplateName(characterToRename?.id)}.
                 </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleRenameCharacter} disabled={!renameInputValue.trim()}>
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to get base template name for the rename dialog
function baseTemplateName(characterId?: string): string | null {
    if (!characterId || characterId === 'custom') return null;
    const template = charactersData.find(c => c.id === characterId);
    return template?.name || characterId;
}

