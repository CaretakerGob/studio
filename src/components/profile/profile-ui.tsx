
"use client";

import type { FormEvent, ChangeEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, ShieldCheck, LogOut, Edit3, ListChecks, Trash2, Eye, Copy, UserCog, Star, CircleDot, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SignUpCredentials } from '@/types/auth';
import type { Character } from '@/types/character';
import { charactersData } from '@/components/character-sheet/character-sheet-ui';
import { auth, storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth"; // Added sendPasswordResetEmail
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
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

import { AuthForm } from './auth-form';
import { UserProfileDisplay } from './user-profile-display';
import { EditProfileForm } from './edit-profile-form';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';


// Helper function
function baseTemplateName(characterTemplateId?: string): string {
    if (!characterTemplateId) return 'Unknown Base';
    const defaultCustomName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";
    if (characterTemplateId === 'custom') return defaultCustomName;
    const template = charactersData.find(c => c.id === characterTemplateId);
    return template?.name || characterTemplateId.charAt(0).toUpperCase() + characterTemplateId.slice(1);
}


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
  const [isProcessing, setIsProcessing] = useState(false); // General processing state for Firestore ops

  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [isLoadingSavedChars, setIsLoadingSavedChars] = useState(false);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);

  const [characterToRename, setCharacterToRename] = useState<Character | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false);

  const [defaultCharacterId, setDefaultCharacterId] = useState<string | null>(null);
  const [isLoadingDefaultCharId, setIsLoadingDefaultCharId] = useState(false);

  // Simulated friends list
  const simulatedFriends = [
    { id: 'friend1', name: 'Beast Slayer 9000', avatarSeed: 'friendone', isOnline: true },
    { id: 'friend2', name: 'RotB_Master', avatarSeed: 'friendtwo', isOnline: false },
    { id: 'friend3', name: 'Critter Getter', avatarSeed: 'friendthree', isOnline: true },
  ];


  useEffect(() => {
    if (currentUser) {
      setFormData({ email: currentUser.email || "", password: "", passwordConfirmation: "", displayName: currentUser.displayName || "" });
      setEditFormData({ displayName: currentUser.displayName || "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
      setIsSigningUp(false);
      fetchSavedCharacters();
      fetchDefaultCharacterPreference();
    } else {
      setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
      setEditFormData({ displayName: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsSigningUp(false);
      setSavedCharacters([]);
      setDefaultCharacterId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchSavedCharacters = useCallback(async () => {
    if (!currentUser || !auth.currentUser) return;
    setIsLoadingSavedChars(true);
    try {
      const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
      const querySnapshot = await getDocs(charactersCollectionRef);
      const chars = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Character, 'id'> & { templateId?: string; lastSaved?: string };
        return {
          ...data,
          id: docSnap.id,
          templateId: data.templateId || (docSnap.id === 'custom' ? 'custom' : docSnap.id),
          lastSaved: data.lastSaved || undefined
        };
      });
      setSavedCharacters(chars.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));
    } catch (err) {
      console.error("Error fetching saved characters for profile:", err);
      toast({ title: "Load Error", description: "Could not fetch your saved characters.", variant: "destructive" });
      setSavedCharacters([]);
    } finally {
      setIsLoadingSavedChars(false);
    }
  }, [currentUser, toast]);


  const fetchDefaultCharacterPreference = useCallback(async () => {
    if (!currentUser || !auth.currentUser) return;
    setIsLoadingDefaultCharId(true);
    try {
      const prefsDocRef = doc(db, "userCharacters", auth.currentUser.uid, "preferences", "userPrefs");
      const docSnap = await getDoc(prefsDocRef);
      if (docSnap.exists()) {
        setDefaultCharacterId(docSnap.data()?.defaultCharacterId || null);
      } else {
        setDefaultCharacterId(null);
      }
    } catch (err) {
      console.error("Error fetching default character preference:", err);
      setDefaultCharacterId(null);
    } finally {
      setIsLoadingDefaultCharId(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if(currentUser) {
      fetchSavedCharacters();
      fetchDefaultCharacterPreference();
    }
  }, [currentUser, fetchSavedCharacters, fetchDefaultCharacterPreference]);


  const handleSetDefaultCharacter = async (characterId: string | null) => {
    if (!currentUser || !auth.currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to set a default character.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    const newDefaultId = defaultCharacterId === characterId ? null : characterId;
    try {
      const prefsDocRef = doc(db, "userCharacters", auth.currentUser.uid, "preferences", "userPrefs");
      await setDoc(prefsDocRef, { defaultCharacterId: newDefaultId }, { merge: true });
      setDefaultCharacterId(newDefaultId);
      if (newDefaultId) {
        const char = savedCharacters.find(c => c.id === newDefaultId);
        toast({ title: "Default Character Set", description: `${char?.name || baseTemplateName(char?.templateId) || newDefaultId} is now your default.` });
      } else {
        toast({ title: "Default Character Cleared", description: "You no longer have a default character." });
      }
    } catch (err) {
      console.error("Error setting default character:", err);
      toast({ title: "Error", description: "Could not update default character preference.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
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
    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const { email, password } = formData;
    if (!email || !password) {
      if(setAuthError) setAuthError("Email and password are required.");
      setIsProcessing(false);
      return;
    }
    const user = await login({ email, password });
    if (user) {
      toast({
        title: "Logged In Successfully!",
        description: `Welcome back, ${user.displayName || user.email}!`,
      });
    }
    setIsProcessing(false);
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const { email, password, passwordConfirmation, displayName } = formData;
    if (!email || !password || !passwordConfirmation) {
      if(setAuthError) setAuthError("Email, password, and password confirmation are required.");
      setIsProcessing(false);
      return;
    }
    if (password !== passwordConfirmation) {
      if(setAuthError) setAuthError("Passwords do not match.");
      setIsProcessing(false);
      return;
    }
    const user = await signUp({ email, password, displayName });
    if (user) {
      toast({
        title: "Signed Up Successfully!",
        description: `Welcome, ${user.displayName || user.email}! You are now logged in.`,
      });
    }
    setIsProcessing(false);
  };

  const handleLogout = async () => {
    setIsProcessing(true);
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setIsProcessing(false);
  };

  const toggleSignUpMode = () => {
    setIsSigningUp(!isSigningUp);
    setFormData({ email: "", password: "", passwordConfirmation: "", displayName: "" });
    if(setAuthError) setAuthError(null);
  };

  const handleLoadCharacter = (characterId: string) => {
    const charToLoad = savedCharacters.find(c => c.id === characterId);
    if (charToLoad) {
        router.push(`/character-sheet?load=${charToLoad.id}`);
        toast({ title: "Loading Character", description: `Attempting to load ${charToLoad.name || baseTemplateName(charToLoad.templateId) || charToLoad.id}...` });
    } else {
        toast({ title: "Error", description: "Could not find character to load.", variant: "destructive" });
    }
  };

  const openRenameDialog = (char: Character) => {
    setCharacterToRename(char);
    setRenameInputValue(char.name || "");
    setIsRenameDialogOpen(true);
  };

  const handleRenameCharacter = async () => {
    if (!characterToRename || !currentUser || !auth.currentUser) {
      toast({ title: "Error", description: "Character or user session is missing.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const trimmedNewName = renameInputValue.trim();
    let finalNameToSave: string;
    let toastTitle: string;
    let toastDescription: string;
    const defaultCustomName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";
    const baseTemplateForReset = charactersData.find(c => c.id === (characterToRename.templateId || characterToRename.id));


    if (!trimmedNewName) {
      if (characterToRename.templateId === 'custom') {
        finalNameToSave = defaultCustomName;
      } else {
        finalNameToSave = `Custom ${baseTemplateForReset?.name || baseTemplateName(characterToRename.templateId)}`;
      }
      toastTitle = "Name Reset";
      toastDescription = `Character name for '${characterToRename.name || baseTemplateName(characterToRename.templateId)}' reset to: ${finalNameToSave}.`;
    } else {
      finalNameToSave = trimmedNewName;
      toastTitle = "Character Renamed";
      toastDescription = `'${characterToRename.name || baseTemplateName(characterToRename.templateId)}' successfully renamed to '${finalNameToSave}'.`;
    }

    const characterRef = doc(db, "userCharacters", auth.currentUser.uid, "characters", characterToRename.id);
    try {
      await updateDoc(characterRef, {
        name: finalNameToSave,
        lastSaved: new Date().toISOString(),
      });
      toast({ title: toastTitle, description: toastDescription });
      setSavedCharacters(prev =>
        prev.map(c =>
          c.id === characterToRename.id ? { ...c, name: finalNameToSave, lastSaved: new Date().toISOString() } : c
        ).sort((a, b) => (a.name || baseTemplateName(a.templateId) || a.id).localeCompare(b.name || baseTemplateName(b.templateId) || b.id))
      );
      setIsRenameDialogOpen(false);
      setCharacterToRename(null);
    } catch (err) {
      console.error("Error renaming character:", err);
      toast({ title: "Rename Failed", description: "Could not rename character.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };


  const confirmDeleteCharacter = async () => {
    if (!charToDelete || !currentUser || !auth.currentUser) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "userCharacters", auth.currentUser.uid, "characters", charToDelete.id));
      toast({ title: "Character Deleted", description: `${charToDelete.name || baseTemplateName(charToDelete.templateId) || charToDelete.id} has been deleted.` });
      setSavedCharacters(prev => prev.filter(c => c.id !== charToDelete.id));
      if (defaultCharacterId === charToDelete.id) {
        await handleSetDefaultCharacter(null);
      }
    } catch (err) {
      console.error("Error deleting character:", err);
      toast({ title: "Delete Failed", description: "Could not delete character.", variant: "destructive" });
    }
    setCharToDelete(null);
    setIsProcessing(false);
  };

  const handleDuplicateCharacter = async (charToDuplicate: Character) => {
    if (!currentUser || !auth.currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to duplicate characters.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const originalTemplate = charactersData.find(c => c.id === (charToDuplicate.templateId || charToDuplicate.id));
    const originalTemplateName = originalTemplate?.name || 'Character';
    const defaultCustomCharacter = charactersData.find(c => c.id === 'custom');

    let nameToCopy = charToDuplicate.name;

    if (!nameToCopy || (charToDuplicate.templateId !== 'custom' && nameToCopy === originalTemplateName)) {
      nameToCopy = originalTemplateName;
    } else if (charToDuplicate.templateId === 'custom' && (!nameToCopy || nameToCopy === defaultCustomCharacter?.name)) {
      nameToCopy = defaultCustomCharacter?.name || 'Custom Character';
    }


    const newCharacterId = `custom_${Date.now()}`;

    const newCharacterData: Character = {
      id: newCharacterId,
      templateId: 'custom', 
      name: `${nameToCopy || 'Character'} (Copy)`,
      baseStats: { ...(charToDuplicate.baseStats || defaultCustomCharacter?.baseStats ) },
      skills: { ...(charToDuplicate.skills || defaultCustomCharacter?.skills ) },
      abilities: Array.isArray(charToDuplicate.abilities) ? [...charToDuplicate.abilities] : (defaultCustomCharacter?.abilities ? [...defaultCustomCharacter.abilities] : []),
      characterPoints: charToDuplicate.characterPoints !== undefined ? charToDuplicate.characterPoints : (defaultCustomCharacter?.characterPoints || 375),
      selectedArsenalCardId: charToDuplicate.selectedArsenalCardId || null,
      savedCooldowns: { ...(charToDuplicate.savedCooldowns || {}) },
      savedQuantities: { ...(charToDuplicate.savedQuantities || {}) },
      imageUrl: charToDuplicate.templateId === 'custom' && charToDuplicate.imageUrl
                  ? charToDuplicate.imageUrl
                  : defaultCustomCharacter?.imageUrl,
      avatarSeed: `${(nameToCopy || 'copy').toLowerCase().replace(/\s/g, '')}copy${Date.now()}`,
      lastSaved: new Date().toISOString(),
    };

    try {
      const charactersCollectionRef = collection(db, "userCharacters", currentUser.uid, "characters");
      const newDocRef = doc(charactersCollectionRef, newCharacterId);
      await setDoc(newDocRef, newCharacterData);

      const newCharForState: Character = {
        ...newCharacterData,
      };

      setSavedCharacters(prev => [...prev, newCharForState].sort((a,b) => (a.name||baseTemplateName(a.templateId)||a.id).localeCompare(b.name||baseTemplateName(b.templateId)||b.id)));
      toast({ title: "Character Duplicated", description: `${newCharacterData.name} has been created.` });
    } catch (err) {
      console.error("Error duplicating character:", err);
      toast({ title: "Duplication Failed", description: "Could not duplicate character.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser || !currentUser.email) {
      toast({
        title: "Error",
        description: "You must be logged in and have a verified email to change your password.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${currentUser.email}. Please check your inbox.`,
      });
    } catch (err: any) {
      console.error("Error sending password reset email:", err);
      toast({
        title: "Error Sending Email",
        description: err.message || "Could not send password reset email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  if (authLoading && !currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl p-10 text-center">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Checking authentication status.</CardDescription>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        {!currentUser ? (
          <>
            <CardTitle className="text-2xl flex items-center justify-center">
              <UserCog className="mr-2 h-7 w-7" /> {isSigningUp ? "Create Account" : "User Log In"}
            </CardTitle>
            <CardDescription>
              {isSigningUp ? "Sign up to save your character data and more." : "Log in to access your profile and saved data."}
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
            loading={isProcessing || authLoading}
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
            loading={isProcessing || authLoading}
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
              {(isLoadingSavedChars || isProcessing || isLoadingDefaultCharId) ? (
                 <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                 </div>
              ) : savedCharacters.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {savedCharacters.map(char => {
                    const baseTemplate = charactersData.find(t => t.id === (char.templateId || char.id));
                    let finalDisplayName: string;
                    const defaultCustomName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";

                    if (char.templateId === 'custom') {
                        finalDisplayName = (char.name && char.name !== defaultCustomName) 
                                            ? `${char.name} (Custom Character)` 
                                            : defaultCustomName;
                    } else if (baseTemplate) {
                        finalDisplayName = (char.name && char.name !== baseTemplate.name) 
                                            ? `${char.name} (${baseTemplate.name})` 
                                            : baseTemplate.name;
                    } else {
                        finalDisplayName = char.name || char.id; 
                    }


                    const avatarSrc = char.imageUrl || baseTemplate?.imageUrl || `https://placehold.co/40x40.png`;
                    const avatarFallback = (char.name || char.id).substring(0, 2).toUpperCase();
                    const lastSavedDate = char.lastSaved ? new Date(char.lastSaved).toLocaleDateString() : "N/A";
                    const isCurrentDefault = char.id === defaultCharacterId;

                    return (
                      <Card key={char.id} className="p-3 bg-card/50 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarSrc} alt={finalDisplayName} data-ai-hint="character avatar" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{finalDisplayName}</p>
                            <p className="text-xs text-muted-foreground">
                              Base: {baseTemplateName(char.templateId || char.id)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last Saved: {lastSavedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefaultCharacter(char.id)}
                            disabled={isProcessing || isLoadingDefaultCharId}
                            className={cn("h-7 w-7", isCurrentDefault ? "text-yellow-400 hover:text-yellow-500" : "text-muted-foreground hover:text-yellow-400")}
                            title={isCurrentDefault ? "Unset as Default" : "Set as Default"}
                          >
                            <Star className={cn("h-5 w-5", isCurrentDefault && "fill-current")} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleLoadCharacter(char.id)} disabled={isProcessing}>
                            <Eye className="mr-1 h-4 w-4" /> Load
                          </Button>
                           <Button variant="outline" size="sm" onClick={() => openRenameDialog(char)} disabled={isProcessing}>
                            <Edit3 className="mr-1 h-4 w-4" /> Rename
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDuplicateCharacter(char)} disabled={isProcessing}>
                            <Copy className="mr-1 h-4 w-4" /> Duplicate
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setCharToDelete(char)} disabled={isProcessing}>
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
            {/* Simulated Friends List Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
                <Users className="mr-2 h-5 w-5" /> Friends (Simulated)
              </h3>
              <div className="space-y-2">
                {simulatedFriends.map(friend => (
                  <Card key={friend.id} className="p-3 bg-card/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${friend.avatarSeed}/40/40`} alt={friend.name} data-ai-hint="friend avatar" />
                        <AvatarFallback>{friend.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{friend.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CircleDot className={cn("h-4 w-4", friend.isOnline ? "text-green-500 fill-green-500" : "text-muted-foreground")} />
                      <span className={cn("text-xs", friend.isOnline ? "text-green-500" : "text-muted-foreground")}>
                        {friend.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </Card>
                ))}
                <Alert variant="default" className="border-dashed mt-2">
                    <AlertTitle className="text-sm">Note</AlertTitle>
                    <AlertDescription className="text-xs">
                        This friends list is for demonstration purposes. Real-time status and friend management would require further backend integration.
                    </AlertDescription>
                </Alert>
              </div>
            </div>


            <Separator />
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center" 
                onClick={handleChangePassword}
                disabled={!currentUser || isProcessing || authLoading}
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> 
                {isProcessing ? "Processing..." : "Change Password"}
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center justify-center" disabled={isProcessing || authLoading}>
                <LogOut className="mr-2 h-4 w-4" /> {isProcessing ? "Processing..." : (authLoading ? "Logging out..." : "Log Out")}
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
              <span className="font-semibold"> {charToDelete?.name || baseTemplateName(charToDelete?.templateId) || charToDelete?.id}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCharToDelete(null)} disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCharacter} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Yes, delete character"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Character: {characterToRename?.name || baseTemplateName(characterToRename?.templateId) || characterToRename?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="renameCharacterInput">New Name</Label>
            <Input
              id="renameCharacterInput"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder={
                characterToRename?.templateId === 'custom' 
                ? "Enter new name (leave blank to reset to 'Custom Character')" 
                : `Enter new name (leave blank to reset to 'Custom ${baseTemplateName(characterToRename?.templateId)}')`
              }
              disabled={isProcessing}
            />
            {characterToRename?.templateId !== 'custom' && baseTemplateName(characterToRename?.templateId) && (
                 <p className="text-xs text-muted-foreground">
                    Original template: {baseTemplateName(characterToRename?.templateId)}.
                    Leaving blank will rename to: "Custom {baseTemplateName(characterToRename?.templateId)}".
                 </p>
            )}
             {characterToRename?.templateId === 'custom' && (
                 <p className="text-xs text-muted-foreground">
                    Leaving blank will reset name to "Custom Character".
                 </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleRenameCharacter} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

    