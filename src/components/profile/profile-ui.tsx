
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, ShieldCheck, LogOut, Edit3, ListChecks, Trash2, Eye, Copy, UserCog } from "lucide-react"; // Added Copy, UserCog
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SignUpCredentials } from '@/types/auth';
import type { Character } from '@/types/character';
import { charactersData } from '@/components/character-sheet/character-sheet-ui';
import { auth, storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc, setDoc, addDoc } from "firebase/firestore"; // Added setDoc, addDoc
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
  const [isProcessing, setIsProcessing] = useState(false); // General processing state

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
      const chars = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Character, 'id'>; // Firestore doc ID is separate
        return { ...data, id: docSnap.id }; // Use Firestore doc ID as the instance ID
      });
      
      // Map Firestore doc ID to template ID for comparison with charactersData
      const mappedChars = chars.map(c => {
        const templateMatch = charactersData.find(t => t.id === c.id || `custom_${t.id}` === c.id); // Check if the Firestore ID is a template ID or a custom one derived from it
        return {
          ...c,
          templateId: templateMatch ? templateMatch.id : (c.id.startsWith("custom_") ? "custom" : c.id) // This line is tricky, assuming 'id' in Firestore doc IS the template or custom_ ID
        };
      });
      
      setSavedCharacters(mappedChars.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));

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
    // The 'characterId' here is the Firestore document ID.
    // The Character Sheet page expects the 'templateId' or the 'custom_...' ID in the 'load' query param.
    // We need to find the character's original template ID or its 'custom_...' ID to pass.
    const charToLoad = savedCharacters.find(c => c.id === characterId);
    if (charToLoad) {
        // Use charToLoad.id if it's already in 'custom_timestamp' format or a base template id like 'gob'
        // This assumes charToLoad.id is the correct identifier for the CharacterSheet page.
        router.push(`/character-sheet?load=${charToLoad.id}`);
        toast({ title: "Loading Character", description: `Attempting to load ${charToLoad.name || charToLoad.id}...` });
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
    if (!characterToRename || !currentUser || !auth.currentUser || !renameInputValue.trim()) {
      toast({ title: "Error", description: "Character or new name is missing.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    // 'characterToRename.id' here is the Firestore document ID.
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
    } finally {
      setIsProcessing(false);
    }
  };


  const confirmDeleteCharacter = async () => {
    if (!charToDelete || !currentUser || !auth.currentUser) return;
    setIsProcessing(true);
    // 'charToDelete.id' here is the Firestore document ID.
    try {
      await deleteDoc(doc(db, "userCharacters", auth.currentUser.uid, "characters", charToDelete.id));
      toast({ title: "Character Deleted", description: `${charToDelete.name || charToDelete.id} has been deleted.` });
      setSavedCharacters(prev => prev.filter(c => c.id !== charToDelete.id));
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

    const newCharacterData: Omit<Character, 'id'> & { templateId: string } = { // Omit 'id' for addDoc, include templateId
      templateId: charToDuplicate.templateId || charToDuplicate.id, // Store original template ID or 'custom'
      name: `${charToDuplicate.name || charToDuplicate.templateId || 'Character'} (Copy)`,
      baseStats: { ...(charToDuplicate.baseStats || charactersData.find(c=>c.id === (charToDuplicate.templateId || charToDuplicate.id))?.baseStats || charactersData.find(c=>c.id === 'custom')!.baseStats ) },
      skills: { ...(charToDuplicate.skills || charactersData.find(c=>c.id === (charToDuplicate.templateId || charToDuplicate.id))?.skills || charactersData.find(c=>c.id === 'custom')!.skills ) },
      abilities: Array.isArray(charToDuplicate.abilities) ? [...charToDuplicate.abilities] : [],
      characterPoints: charToDuplicate.characterPoints !== undefined ? charToDuplicate.characterPoints : (charactersData.find(c=>c.id === (charToDuplicate.templateId || charToDuplicate.id))?.characterPoints || 375),
      selectedArsenalCardId: charToDuplicate.selectedArsenalCardId || null,
      savedCooldowns: { ...(charToDuplicate.savedCooldowns || {}) },
      savedQuantities: { ...(charToDuplicate.savedQuantities || {}) },
      imageUrl: charToDuplicate.imageUrl || charactersData.find(c=>c.id === (charToDuplicate.templateId || charToDuplicate.id))?.imageUrl,
      avatarSeed: charToDuplicate.avatarSeed || `${(charToDuplicate.name || charToDuplicate.id).toLowerCase().replace(/\s/g, '')}${Date.now()}`,
      lastSaved: new Date().toISOString(),
    };

    try {
      const charactersCollectionRef = collection(db, "userCharacters", currentUser.uid, "characters");
      const newDocRef = await addDoc(charactersCollectionRef, newCharacterData);
      
      const newCharForState: Character = {
        ...newCharacterData,
        id: newDocRef.id, // This is the new Firestore document ID
      };

      setSavedCharacters(prev => [...prev, newCharForState].sort((a,b) => (a.name||a.id).localeCompare(b.name||b.id)));
      toast({ title: "Character Duplicated", description: `${newCharacterData.name} has been created.` });
    } catch (err) {
      console.error("Error duplicating character:", err);
      toast({ title: "Duplication Failed", description: "Could not duplicate character.", variant: "destructive" });
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
              {(isLoadingSavedChars || isProcessing) ? (
                 <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                 </div>
              ) : savedCharacters.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {savedCharacters.map(char => {
                    // char.id here is the Firestore document ID
                    // char.templateId (added in fetch) is the original template ID or 'custom'
                    const baseTemplate = charactersData.find(t => t.id === (char.templateId || char.id));
                    
                    let finalDisplayName = char.name || (baseTemplate?.name || char.id);
                    if (char.templateId === 'custom') {
                        const customTemplateName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";
                        if (char.name && char.name !== customTemplateName) {
                            finalDisplayName = `${char.name} (Custom Character)`;
                        } else {
                            finalDisplayName = customTemplateName;
                        }
                    } else if (baseTemplate && char.name && char.name !== baseTemplate.name) {
                        finalDisplayName = `${char.name} (${baseTemplate.name})`;
                    } else if (baseTemplate) {
                        finalDisplayName = baseTemplate.name;
                    }


                    const avatarSrc = char.imageUrl || baseTemplate?.imageUrl || `https://placehold.co/40x40.png`;
                    const avatarFallback = (char.name || char.id || "XX").substring(0, 2).toUpperCase();
                    const lastSavedDate = char.lastSaved ? new Date(char.lastSaved).toLocaleDateString() : "N/A";

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
                              Template: {baseTemplate?.name || (char.templateId === 'custom' ? 'Custom' : char.templateId || 'Unknown')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last Saved: {lastSavedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-center flex-wrap justify-end">
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
            <div className="space-y-3">
              <Button variant="outline" className="w-full flex items-center justify-center" disabled>
                <ShieldCheck className="mr-2 h-4 w-4" /> Change Password (Placeholder)
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
              <span className="font-semibold"> {charToDelete?.name || charToDelete?.id}</span>.
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
              placeholder={characterToRename?.templateId === 'custom' ? "Enter new character name" : "Enter new name for this template"}
              disabled={isProcessing}
            />
            {characterToRename?.templateId !== 'custom' && baseTemplateName(characterToRename?.templateId) && (
                 <p className="text-xs text-muted-foreground">
                    Original template: {baseTemplateName(characterToRename?.templateId)}.
                 </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleRenameCharacter} disabled={!renameInputValue.trim() || isProcessing}>
              {isProcessing ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to get base template name for the rename dialog
function baseTemplateName(characterTemplateId?: string): string | null {
    if (!characterTemplateId || characterTemplateId === 'custom') return null;
    const template = charactersData.find(c => c.id === characterTemplateId);
    return template?.name || characterTemplateId;
}

interface Character {
  id: string; // This will now be the Firestore document ID for saved characters
  templateId?: string; // This will store the original template ID ('gob', 'custom', etc.)
  name?: string;
  baseStats?: CharacterStats;
  skills?: import('@/types/character').Skills; // Using import type for Skills
  abilities: import('@/types/character').Ability[]; // Using import type for Ability
  avatarSeed?: string;
  imageUrl?: string;
  characterPoints?: number;
  selectedArsenalCardId?: string | null;
  savedCooldowns?: Record<string, number>;
  savedQuantities?: Record<string, number>;
  lastSaved?: string;
}
```
  </change>
  <change>
    <file>/home/user/studio/src/types/character.ts</file>
    <content><![CDATA[
export type StatName = 'hp' | 'maxHp' | 'mv' | 'def' | 'sanity' | 'maxSanity' | 'meleeAttack';
export type SkillName =
  'ath' |
  'cpu' |
  'dare' |
  'dec' |
  'emp' |
  'eng' |
  'inv' |
  'kno' |
  'occ' |
  'pers' |
  'sur' |
  'tac' |
  'tun';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mv: number;
  def: number;
  sanity: number;
  maxSanity: number;
  meleeAttack?: number;
}

export interface Skills {
  ath?: number;
  cpu?: number;
  dare?: number;
  dec?: number;
  emp?: number;
  eng?: number;
  inv?: number;
  kno?: number;
  occ?: number;
  pers?: number;
  sur?: number;
  tac?: number;
  tun?: number;
}

export interface CharacterStatDefinition {
  id: StatName;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export interface SkillDefinition {
  id: SkillName;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export type AbilityType = "Action" | "Interrupt" | "Passive";

export interface Ability {
  id: string;
  name: string;
  type: AbilityType;
  description: string;
  cost?: number | undefined;
  range?: string;
  cooldown?: string;
  details?: string;
  maxQuantity?: number;
}

export interface Weapon {
  name: string;
  attack: number;
  flavorText?: string;
}

export interface RangedWeapon extends Weapon {
  range: number;
}

export interface Character {
  id: string; // For templates, this is 'gob', 'custom', etc. For saved instances, it's the Firestore doc ID.
  templateId?: string; // Explicitly store the original template ID for saved instances.
  name: string;
  baseStats: CharacterStats;
  skills?: Skills;
  abilities: Ability[];
  avatarSeed?: string;
  imageUrl?: string;
  meleeWeapon?: Weapon;
  rangedWeapon?: RangedWeapon;
  characterPoints?: number;
  selectedArsenalCardId?: string | null;
  savedCooldowns?: Record<string, number>;
  savedQuantities?: Record<string, number>;
  lastSaved?: string;
}

