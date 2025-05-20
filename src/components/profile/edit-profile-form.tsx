
"use client";

import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, UploadCloud } from "lucide-react";
import type { User } from 'firebase/auth';
import type { SignUpCredentials } from '@/types/auth'; // Using SignUpCredentials for formData structure

interface EditProfileFormProps {
  currentUser: User;
  formData: Pick<SignUpCredentials, 'displayName'>; // Only need displayName from original formData
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSaveChanges: (e: FormEvent) => Promise<void>;
  handleCancelEdit: () => void;
  isUploading: boolean;
  loading: boolean; // Auth loading
  previewUrl: string | null;
  selectedFile: File | null;
}

export function EditProfileForm({
  currentUser,
  formData,
  handleInputChange,
  handleFileChange,
  handleSaveChanges,
  handleCancelEdit,
  isUploading,
  loading,
  previewUrl,
  selectedFile,
}: EditProfileFormProps) {
  return (
    <form onSubmit={handleSaveChanges} className="space-y-4">
       <div className="text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg relative group">
            <AvatarImage 
                src={previewUrl || currentUser.photoURL || `https://placehold.co/128x128.png`} 
                alt={currentUser.displayName || "User"} 
                data-ai-hint="user avatar placeholder" 
            />
            <AvatarFallback className="text-4xl bg-muted">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
            </AvatarFallback>
            <label 
                htmlFor="profileImageUpload" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            >
                <UploadCloud className="h-8 w-8" />
                <span className="sr-only">Upload new image</span>
            </label>
        </Avatar>
        <Input 
            id="profileImageUpload" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden"
            disabled={isUploading || loading}
        />
       </div>
      {selectedFile && previewUrl && (
        <div className="space-y-2 text-center">
            <Label>New Profile Image Preview:</Label>
            <Image src={previewUrl} alt="New profile image preview" width={100} height={100} className="rounded-md border mx-auto" data-ai-hint="image preview"/>
        </div>
      )}
      <div>
        <Label htmlFor="profileDisplayName">Display Name</Label>
        <Input
          id="profileDisplayName"
          name="displayName"
          value={formData.displayName || ""}
          onChange={handleInputChange}
          disabled={isUploading || loading}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isUploading || loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isUploading || loading || (!selectedFile && formData.displayName === (currentUser.displayName || ""))}>
          <Save className="mr-2 h-4 w-4" /> {isUploading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
