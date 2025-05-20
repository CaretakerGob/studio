
"use client";

import type { ChangeEvent } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"; // Added CardContent
import { UserCircle, RotateCcw, Edit2, UserCog, Award } from "lucide-react";
import type { User } from 'firebase/auth';
import type { Character } from '@/types/character';

interface CharacterHeaderProps {
  selectedCharacterId: string;
  editableCharacterData: Character | null;
  characterDropdownOptions: Array<{ id: string; name: string; displayNameInDropdown: string }>;
  currentUser: User | null;
  isLoadingCharacter: boolean;
  onCharacterDropdownChange: (id: string) => void;
  onCustomCharacterNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLoadSavedCustomCharacter: () => void;
  onResetStats: () => void;
}

export function CharacterHeader({
  selectedCharacterId,
  editableCharacterData,
  characterDropdownOptions,
  currentUser,
  isLoadingCharacter,
  onCharacterDropdownChange,
  onCustomCharacterNameChange,
  onLoadSavedCustomCharacter,
  onResetStats,
}: CharacterHeaderProps) {

  if (!editableCharacterData) {
    return (
        <CardHeader>
            <CardTitle>Loading Character...</CardTitle>
        </CardHeader>
    )
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <UserCircle className="mr-3 h-10 w-10 text-primary" />
                <CardTitle className="text-3xl">Character Sheet</CardTitle>
            </div>
            <Button variant="ghost" onClick={onResetStats} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Template
            </Button>
        </div>
        <CardDescription>Manage your character's attributes, abilities, and status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6"> {/* Added CardContent wrapper as it was missing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 space-y-4">
            <div className="w-full">
              <Label htmlFor="characterName" className="text-lg font-medium mb-1 block">Character Template</Label>
              <Select value={selectedCharacterId} onValueChange={onCharacterDropdownChange}>
                <SelectTrigger id="characterName" className="text-xl p-2 w-full">
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
             {editableCharacterData?.id === 'custom' && (
              <>
                <div className="w-full">
                  <Label htmlFor="customCharacterName" className="text-lg font-medium mb-1 block">
                    Character Name
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="customCharacterName"
                      type="text"
                      value={editableCharacterData.name === 'Custom Character' && !characterDropdownOptions.find(c => c.id === 'custom' && c.name !== 'Custom Character') ? '' : editableCharacterData.name}
                      onChange={onCustomCharacterNameChange}
                      placeholder="Enter custom name"
                      className="text-lg p-2 flex-grow"
                    />
                    <Edit2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                {currentUser && (
                  <Button
                    onClick={onLoadSavedCustomCharacter}
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingCharacter}
                  >
                    <UserCog className="mr-2 h-4 w-4" /> Load My Saved Custom
                  </Button>
                )}
              </>
            )}
          </div>

           <div className="md:col-span-2 space-y-4 flex justify-end">
              {editableCharacterData && editableCharacterData.characterPoints !== undefined && (
              <div className="p-3 rounded-lg border border-border bg-card/50 shadow-md w-fit flex flex-col items-end">
                  <Label className="text-md font-medium flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Character Points
                  </Label>
                  <p className="text-xl font-bold text-primary mt-1">
                  {editableCharacterData.characterPoints}
                  </p>
              </div>
              )}
          </div>
        </div>
        <Separator />
      </CardContent>
    </>
  );
}
