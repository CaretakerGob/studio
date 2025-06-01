
"use client";

import type { ChangeEvent } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { UserCircle, RotateCcw, Edit2, UserCog, Award } from "lucide-react";
import type { User } from 'firebase/auth';
import type { Character } from '@/types/character';
import type { ArsenalCard as ActualArsenalCard } from '@/types/arsenal';
import { Separator } from '@/components/ui/separator';
import { charactersData } from './character-sheet-ui';

interface CharacterHeaderProps {
  selectedCharacterId: string;
  editableCharacterData: Character | null;
  characterDropdownOptions: Array<{ id: string; name: string; displayNameInDropdown: string }>;
  currentUser: User | null;
  isLoadingCharacter: boolean;
  onCharacterDropdownChange: (id: string) => void;
  onCustomCharacterNameChange: (e: ChangeEvent<HTMLInputElement>) => void; // Still useful for renaming any character
  onResetStats: () => void;
  rawArsenalCards: ActualArsenalCard[];
}

export function CharacterHeader({
  selectedCharacterId,
  editableCharacterData,
  characterDropdownOptions,
  currentUser,
  isLoadingCharacter,
  onCharacterDropdownChange,
  onCustomCharacterNameChange, // Retained for general renaming if applicable to all
  onResetStats,
}: CharacterHeaderProps) {

  if (!editableCharacterData) {
    return (
        <CardHeader>
            <CardTitle className="text-3xl">Loading Character...</CardTitle>
        </CardHeader>
    )
  }

  const characterDisplayNameForTitle = editableCharacterData.name ||
                                     (charactersData.find(c => c.id === selectedCharacterId)?.name) ||
                                     "Character";

  return (
    <>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center">
                <UserCircle className="mr-3 h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                <CardTitle className="text-2xl sm:text-3xl">{characterDisplayNameForTitle}</CardTitle>
            </div>
            <Button variant="ghost" onClick={onResetStats} size="sm" className="self-end sm:self-center">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Template
            </Button>
        </div>
        <CardDescription>Manage your character's attributes, abilities, and status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          <div className="md:col-span-2 space-y-4">
            <div className="w-full">
              <Label htmlFor="characterName" className="text-md sm:text-lg font-medium mb-1 block">Character Template</Label>
              <Select value={selectedCharacterId} onValueChange={onCharacterDropdownChange}>
                <SelectTrigger id="characterName" className="text-md sm:text-xl p-2 w-full">
                  <SelectValue placeholder="Select a character" />
                </SelectTrigger>
                <SelectContent>
                  {characterDropdownOptions.map(charOpt => (
                     <SelectItem key={charOpt.id} value={charOpt.id}>
                       {charOpt.displayNameInDropdown}
                     </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {/* "Custom Character" specific name input and load button removed */}
             {/* The following block could be generalized if you want to allow renaming ANY saved character directly here */}
             {/* For now, renaming is handled in the Profile page */}
            {/*
            {editableCharacterData && currentUser && ( // Example: If you want to rename any saved character
              <div className="w-full">
                <Label htmlFor="characterInstanceName" className="text-md sm:text-lg font-medium mb-1 block">
                  Character Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="characterInstanceName"
                    type="text"
                    value={editableCharacterData.name}
                    onChange={onCustomCharacterNameChange} // Renamed to reflect generic name change
                    placeholder="Enter name"
                    className="text-md sm:text-lg p-2 flex-grow"
                  />
                  <Edit2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
            */}
          </div>

           <div className="md:col-span-1 space-y-4 flex md:justify-end">
              {/* Character Points display is now removed as it was primarily for custom characters */}
          </div>
        </div>
        <Separator />
      </CardContent>
    </>
  );
}
