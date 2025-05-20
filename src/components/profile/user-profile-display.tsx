
"use client";

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit3 } from "lucide-react";
import type { User } from 'firebase/auth';

interface UserProfileDisplayProps {
  currentUser: User;
  handleEditToggle: () => void;
}

export function UserProfileDisplay({ currentUser, handleEditToggle }: UserProfileDisplayProps) {
  return (
    <>
      <div className="text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg relative group">
          <AvatarImage 
            src={currentUser.photoURL || `https://placehold.co/128x128.png`} 
            alt={currentUser.displayName || "User"} 
            data-ai-hint="user avatar placeholder" 
          />
          <AvatarFallback className="text-4xl bg-muted">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="profileDisplayName">Display Name</Label>
          <Input
            id="profileDisplayName"
            name="displayName"
            value={currentUser.displayName || ""}
            readOnly
            disabled
            className="mt-1 bg-muted/50"
          />
        </div>
        <div>
          <Label htmlFor="profileEmail">Email Address</Label>
          <Input
            id="profileEmail"
            name="email"
            type="email"
            value={currentUser.email || ""}
            readOnly
            disabled
            className="mt-1 bg-muted/50"
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleEditToggle}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </div>
    </>
  );
}
