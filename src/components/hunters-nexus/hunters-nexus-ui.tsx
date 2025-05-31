
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dices,
  Layers3,
  Users2,
  UserCircle2,
  Settings,
  LogOut,
  Dot,
  ChevronsRight,
  Heart,
  Brain,
  Footprints,
  Shield,
  Sword as MeleeIcon,
  Swords,
  UserMinus,
  UserPlus,
  BookOpen,
  Package,
  AlertCircle,
  ImageIcon,
  Info,
  ListChecks,
  BookMarked,
  Library,
  Sparkles,
  PersonStanding,
  Laptop,
  Star as StarIcon,
  VenetianMask,
  HeartHandshake,
  Wrench,
  Search,
  Smile,
  Leaf,
  ClipboardList,
  SlidersHorizontal,
  X,
  Minus,
  Plus,
  Clock,
  Box,
  Briefcase, // Icon for Arsenal Gear
  Crosshair // for Ranged Weapon
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { charactersData, type Character, type CharacterStats, type StatName, skillDefinitions, type SkillName, type Ability as CharacterAbility, type AbilityType, type Weapon, type RangedWeapon } from '@/components/character-sheet/character-sheet-ui';
import { sampleDecks, type GameCard } from '@/components/card-generator/card-generator-ui';
import { GameCardDisplay } from '@/components/card-generator/game-card-display';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ArsenalCard as ActualArsenalCard, ArsenalItem, ParsedStatModifier, ArsenalItemCategory } from '@/types/arsenal';
import { AbilityCard } from '@/components/character-sheet/ability-card';


interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string;
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];

const MIN_SWIPE_DISTANCE = 50;
const MAX_TAP_MOVEMENT = 10;
const ZOOM_SCALE_FACTOR = 1.75;

interface HuntersNexusUIProps {
  arsenalCards?: ActualArsenalCard[];
}

const parseCooldownRounds = (cooldownString?: string | number): number | undefined => {
  if (typeof cooldownString === 'number') return cooldownString;
  if (!cooldownString) return undefined;
  const match = String(cooldownString).match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
};

// Helper functions (copied from character-sheet/page.tsx for arsenal parsing in Nexus)
function parseEffectStatChange(statString: string | undefined): ParsedStatModifier[] {
  if (!statString || typeof statString !== 'string' || statString.trim() === '') {
    return [];
  }
  const modifiers: ParsedStatModifier[] = [];
  const changes = statString.split(/[,;]/).map(s => s.trim()).filter(Boolean);

  const statNameMap: Record<string, StatName> = {
    'max hp': 'maxHp', 'maxhp': 'maxHp', 'hp': 'hp',
    'mv': 'mv', 'movement': 'mv',
    'def': 'def', 'defense': 'def',
    'sanity': 'sanity', 'max sanity': 'maxSanity', 'maxsanity': 'maxSanity',
    'melee attack': 'meleeAttack',
  };

  for (const change of changes) {
    const match = change.toLowerCase().match(/([a-zA-Z\s]+)\s*([+-])\s*(\d+)/);
    if (match) {
      const rawStatName = match[1].trim().toLowerCase();
      const operator = match[2];
      const value = parseInt(match[3], 10);
      const targetStatKey = statNameMap[rawStatName];
      if (targetStatKey) { 
        modifiers.push({ targetStat: targetStatKey, value: operator === '+' ? value : -value });
      }
    }
  }
  return modifiers;
}

function parseWeaponDetailsString(detailsStr?: string): { attack?: number; range?: number; rawDetails: string } | undefined {
  if (!detailsStr || typeof detailsStr !== 'string' || detailsStr.trim() === '') return undefined;
  const parsed: { attack?: number; range?: number; rawDetails: string } = { rawDetails: detailsStr };
  const match = detailsStr.match(/A(\d+)(?:\s*[\/-]?\s*R(\d+))?/i);
  if (match) {
    if (match[1]) parsed.attack = parseInt(match[1], 10);
    if (match[2]) parsed.range = parseInt(match[2], 10);
  }
  return parsed.attack !== undefined ? parsed : { rawDetails: detailsStr };
}


export function HuntersNexusUI({ arsenalCards = [] }: HuntersNexusUIProps) {
  const { toast } = useToast();

  const [nexusNumCombatDice, setNexusNumCombatDice] = useState('1');
  const [nexusNumDice, setNexusNumDice] = useState('1');
  const [nexusDiceSides, setNexusDiceSides] = useState('6');
  const [nexusLatestRoll, setNexusLatestRoll] = useState<NexusRollResult | null>(null);
  const [nexusRollKey, setNexusRollKey] = useState(0);

  const [selectedNexusCharacter, setSelectedNexusCharacter] = useState<Character | null>(null);
  const [isCharacterSelectionDialogOpen, setIsCharacterSelectionDialogOpen] = useState(false);
  const [partyMembers, setPartyMembers] = useState<Character[]>([]);

  const [selectedCharacterArsenalId, setSelectedCharacterArsenalId] = useState<string | null>(null);

  const [currentNexusHp, setCurrentNexusHp] = useState<number | null>(null);
  const [currentNexusSanity, setCurrentNexusSanity] = useState<number | null>(null);
  const [currentNexusMv, setCurrentNexusMv] = useState<number | null>(null);
  const [currentNexusDef, setCurrentNexusDef] = useState<number | null>(null);
  const [nexusSessionMaxHpModifier, setNexusSessionMaxHpModifier] = useState(0);
  const [nexusSessionMaxSanityModifier, setNexusSessionMaxSanityModifier] = useState(0);
  
  const [nexusSessionMeleeAttackModifier, setNexusSessionMeleeAttackModifier] = useState(0);
  const [nexusSessionRangedAttackModifier, setNexusSessionRangedAttackModifier] = useState(0);
  const [nexusSessionRangedRangeModifier, setNexusSessionRangedRangeModifier] = useState(0);
  
  const [nexusDrawnCardsHistory, setNexusDrawnCardsHistory] = useState<GameCard[]>([]);
  const [nexusSelectedDeckName, setNexusSelectedDeckName] = useState<string | undefined>(undefined);
  const [nexusCardKey, setNexusCardKey] = useState(0);

  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);

  const [isCharacterCardModalOpen, setIsCharacterCardModalOpen] = useState(false);
  const [characterForModal, setCharacterForModal] = useState<Character | null>(null);

  const [nexusCurrentAbilityCooldowns, setNexusCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [nexusMaxAbilityCooldowns, setNexusMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [nexusCurrentAbilityQuantities, setNexusCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [nexusMaxAbilityQuantities, setNexusMaxAbilityQuantities] = useState<Record<string, number>>({});


  const criticalArsenalError = useMemo(() => {
    if (!arsenalCards || arsenalCards.length === 0) return null;
    return arsenalCards.find(card => card.id === 'error-critical-arsenal');
  }, [arsenalCards]);

  const currentNexusArsenal = useMemo(() => {
    if (!selectedCharacterArsenalId || !arsenalCards || arsenalCards.length === 0) {
      return null;
    }
    const card = arsenalCards.find(c => c.id === selectedCharacterArsenalId);
    if (!card || card.id.startsWith('error-')) {
      return null;
    }
    return card;
  }, [selectedCharacterArsenalId, arsenalCards]);


  const effectiveNexusCharacterStats: CharacterStats | null = useMemo(() => {
    if (!characterForModal) { // Changed from selectedNexusCharacter to characterForModal
      return null;
    }
    let calculatedStats: CharacterStats = JSON.parse(JSON.stringify(characterForModal.baseStats || { hp: 1, maxHp: 1, mv: 1, def: 1, sanity: 1, maxSanity: 1, meleeAttack: 0 }));

    if (currentNexusArsenal) {
      calculatedStats.hp = (calculatedStats.hp || 0) + (currentNexusArsenal.hpMod || 0);
      calculatedStats.maxHp = (calculatedStats.maxHp || 1) + (currentNexusArsenal.maxHpMod || 0);
      calculatedStats.mv = (calculatedStats.mv || 0) + (currentNexusArsenal.mvMod || 0);
      calculatedStats.def = (calculatedStats.def || 0) + (currentNexusArsenal.defMod || 0);
      calculatedStats.sanity = (calculatedStats.sanity || 0) + (currentNexusArsenal.sanityMod || 0);
      calculatedStats.maxSanity = (calculatedStats.maxSanity || 1) + (currentNexusArsenal.maxSanityMod || 0);
      // Melee attack from global arsenal mods is handled in weapon calculation now.

      if (currentNexusArsenal.items) {
        currentNexusArsenal.items.forEach(item => {
          if (item.category?.toUpperCase() === 'GEAR' && item.parsedStatModifiers) {
            item.parsedStatModifiers.forEach(mod => {
              const statKey = mod.targetStat as keyof CharacterStats;
              if (statKey in calculatedStats && typeof (calculatedStats[statKey]) === 'number') {
                (calculatedStats[statKey] as number) = Math.max(
                    (statKey === 'maxHp' || statKey === 'maxSanity') ? 1 : 0, 
                    (calculatedStats[statKey] as number) + mod.value
                );
              }
            });
          }
        });
      }
    }
    calculatedStats.hp = Math.max(0, calculatedStats.hp);
    calculatedStats.maxHp = Math.max(1, calculatedStats.maxHp);
    calculatedStats.mv = Math.max(0, calculatedStats.mv);
    calculatedStats.def = Math.max(0, calculatedStats.def);
    calculatedStats.sanity = Math.max(0, calculatedStats.sanity);
    calculatedStats.maxSanity = Math.max(1, calculatedStats.maxSanity);
    calculatedStats.meleeAttack = Math.max(0, calculatedStats.meleeAttack ?? 0); // Keep this as a base if needed elsewhere
    if (calculatedStats.hp > calculatedStats.maxHp) calculatedStats.hp = calculatedStats.maxHp;
    if (calculatedStats.sanity > calculatedStats.maxSanity) calculatedStats.sanity = calculatedStats.maxSanity;
    return calculatedStats;
  }, [characterForModal, currentNexusArsenal]);

  const effectiveNexusCharacterAbilities = useMemo(() => {
    const result: { baseAbilities: CharacterAbility[], arsenalAbilities: CharacterAbility[] } = {
      baseAbilities: [],
      arsenalAbilities: [],
    };

    if (!characterForModal) return result;

    result.baseAbilities = characterForModal.abilities ? [...characterForModal.abilities] : [];
    
    if (currentNexusArsenal && currentNexusArsenal.items) {
      currentNexusArsenal.items.forEach(item => {
        const createAbilityFromFlag = (type: AbilityType, flag: boolean | undefined, flagSource: string) => {
          if (flag === true) {
            result.arsenalAbilities.push({
              id: `nexus-arsenal-${currentNexusArsenal.id}-${item.id}-${type.replace(/\s+/g, '')}-${flagSource}`,
              name: item.abilityName || `Arsenal ${type}`,
              type: type,
              description: item.itemDescription || item.effect || `Granted by ${item.abilityName || 'equipped arsenal item'}.`,
              cooldown: item.cd,
              maxQuantity: item.qty,
              details: item.class || item.type,
              cost: 0,
            });
          }
        };
        createAbilityFromFlag('Action', item.isAction, 'isAction');
        createAbilityFromFlag('Interrupt', item.isInterrupt, 'isInterrupt');
        createAbilityFromFlag('Passive', item.isPassive, 'isPassive');
        createAbilityFromFlag('FREE Action', item.isFreeAction, 'isFreeAction');
      });
    }
    return result;
  }, [characterForModal, currentNexusArsenal]);

  const characterDefaultMeleeWeaponForNexus = useMemo(() => {
      if (!characterForModal) return undefined;
      const template = charactersData.find(c => c.id === (characterForModal.templateId || characterForModal.id));
      return template?.meleeWeapon
          ? { ...template.meleeWeapon }
          : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };
  }, [characterForModal]);

  const characterDefaultRangedWeaponForNexus = useMemo(() => {
      if (!characterForModal) return undefined;
      const template = charactersData.find(c => c.id === (characterForModal.templateId || characterForModal.id));
      return template?.rangedWeapon
          ? { ...template.rangedWeapon } as RangedWeapon
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" } as RangedWeapon;
  }, [characterForModal]);

  const effectiveNexusMeleeWeapon = useMemo(() => {
      if (!characterForModal) return undefined;
      let weaponToDisplay: Weapon | undefined = JSON.parse(JSON.stringify(characterDefaultMeleeWeaponForNexus)); 

      if (currentNexusArsenal?.items) {
          const arsenalMeleeItem = currentNexusArsenal.items.find(item =>
             !item.isPet &&
             (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) &&
             item.parsedWeaponStats?.attack !== undefined &&
             (!item.parsedWeaponStats?.range || item.parsedWeaponStats.range <= 1 || item.parsedWeaponStats.range === 0)
          );
          if (arsenalMeleeItem?.parsedWeaponStats?.attack !== undefined) {
              weaponToDisplay = {
                  name: arsenalMeleeItem.abilityName || 'Arsenal Melee',
                  attack: arsenalMeleeItem.parsedWeaponStats.attack,
                  flavorText: arsenalMeleeItem.itemDescription || arsenalMeleeItem.parsedWeaponStats.rawDetails,
              };
          }
      }
      if (currentNexusArsenal && weaponToDisplay) {
          weaponToDisplay = {
              ...weaponToDisplay,
              attack: (weaponToDisplay.attack || 0) + (currentNexusArsenal.meleeAttackMod || 0),
          };
      }
      
      if (weaponToDisplay) {
        weaponToDisplay.attack = Math.max(0, (weaponToDisplay.attack || 0) + nexusSessionMeleeAttackModifier);
      }

      const template = charactersData.find(c => c.id === (characterForModal.templateId || characterForModal.id));
      if (weaponToDisplay?.name === "Fists" && weaponToDisplay.attack === (1 + nexusSessionMeleeAttackModifier) && 
          !template?.meleeWeapon?.name &&
          !currentNexusArsenal?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (!i.parsedWeaponStats?.range || i.parsedWeaponStats.range <= 1)) &&
          !currentNexusArsenal?.meleeAttackMod &&
          characterForModal.templateId !== 'custom'
      ) {
        return undefined;
      }
      return weaponToDisplay;
  }, [characterForModal, currentNexusArsenal, characterDefaultMeleeWeaponForNexus, nexusSessionMeleeAttackModifier]);

  const effectiveNexusRangedWeapon = useMemo(() => {
      if (!characterForModal) return undefined;
      let weaponToDisplay: RangedWeapon | undefined = JSON.parse(JSON.stringify(characterDefaultRangedWeaponForNexus));

      if (currentNexusArsenal?.items) {
          const arsenalRangedItem = currentNexusArsenal.items.find(item =>
             !item.isPet &&
             (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) &&
             item.parsedWeaponStats?.attack !== undefined &&
             item.parsedWeaponStats?.range !== undefined && item.parsedWeaponStats.range > 1
          );
          if (arsenalRangedItem?.parsedWeaponStats?.attack !== undefined && arsenalRangedItem.parsedWeaponStats.range !== undefined) {
              weaponToDisplay = {
                  name: arsenalRangedItem.abilityName || 'Arsenal Ranged',
                  attack: arsenalRangedItem.parsedWeaponStats.attack,
                  range: arsenalRangedItem.parsedWeaponStats.range,
                  flavorText: arsenalRangedItem.itemDescription || arsenalRangedItem.parsedWeaponStats.rawDetails,
              };
          }
      }
      if (currentNexusArsenal && weaponToDisplay) {
          weaponToDisplay = {
              ...weaponToDisplay,
              attack: (weaponToDisplay.attack || 0) + (currentNexusArsenal.rangedAttackMod || 0),
              range: (weaponToDisplay.range || 0) + (currentNexusArsenal.rangedRangeMod || 0),
          };
      }

      if (weaponToDisplay) {
        weaponToDisplay.attack = Math.max(0, (weaponToDisplay.attack || 0) + nexusSessionRangedAttackModifier);
        weaponToDisplay.range = Math.max(0, (weaponToDisplay.range || 0) + nexusSessionRangedRangeModifier);
      }

      const template = charactersData.find(c => c.id === (characterForModal.templateId || characterForModal.id));
      if (weaponToDisplay?.name === "None" && weaponToDisplay.attack === (0 + nexusSessionRangedAttackModifier) && weaponToDisplay.range === (0 + nexusSessionRangedRangeModifier) && 
          !template?.rangedWeapon?.name &&
          !currentNexusArsenal?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 1)) &&
          !currentNexusArsenal?.rangedAttackMod && !currentNexusArsenal?.rangedRangeMod &&
          characterForModal.templateId !== 'custom'
      ) {
        return undefined;
      }
      return weaponToDisplay;
  }, [characterForModal, currentNexusArsenal, characterDefaultRangedWeaponForNexus, nexusSessionRangedAttackModifier, nexusSessionRangedRangeModifier]);

  const arsenalProvidedEquipment = useMemo(() => {
    if (!currentNexusArsenal?.items) return [];
    return currentNexusArsenal.items.filter(item => {
      if (item.isPet) return false;
      const isWeapon = item.isFlaggedAsWeapon || 
                       item.category?.toUpperCase() === 'WEAPON' || 
                       !!item.parsedWeaponStats?.attack ||
                       ((item.category?.toUpperCase() === 'LOAD OUT' || item.category?.toUpperCase() === 'LOADOUT') && item.type?.toUpperCase() === 'WEAPON');
      const isGear = item.category?.toUpperCase() === 'GEAR' || 
                     ((item.category?.toUpperCase() === 'LOAD OUT' || item.category?.toUpperCase() === 'LOADOUT') && item.type?.toUpperCase() === 'GEAR');
      return isWeapon || isGear;
    });
  }, [currentNexusArsenal]);


  useEffect(() => {
    if (characterForModal && effectiveNexusCharacterStats) { // Use characterForModal
      setCurrentNexusHp(effectiveNexusCharacterStats.hp);
      setCurrentNexusSanity(effectiveNexusCharacterStats.sanity);
      setCurrentNexusMv(effectiveNexusCharacterStats.mv);
      setCurrentNexusDef(effectiveNexusCharacterStats.def);
      setNexusSessionMaxHpModifier(0); 
      setNexusSessionMaxSanityModifier(0);
      setNexusSessionMeleeAttackModifier(0);
      setNexusSessionRangedAttackModifier(0);
      setNexusSessionRangedRangeModifier(0);
    } else {
      setCurrentNexusHp(null);
      setCurrentNexusSanity(null);
      setCurrentNexusMv(null);
      setCurrentNexusDef(null);
      setNexusSessionMaxHpModifier(0);
      setNexusSessionMaxSanityModifier(0);
      setNexusSessionMeleeAttackModifier(0);
      setNexusSessionRangedAttackModifier(0);
      setNexusSessionRangedRangeModifier(0);
    }
  }, [characterForModal, effectiveNexusCharacterStats]); // Use characterForModal

  useEffect(() => {
    if (!enlargedImageUrl) {
      setImageZoomLevel(1);
    }
  }, [enlargedImageUrl]);

  const abilityDataStringForEffect = useMemo(() => {
    if (!characterForModal || (!effectiveNexusCharacterAbilities.baseAbilities.length && !effectiveNexusCharacterAbilities.arsenalAbilities.length)) return '';
    const allAbilities = [...effectiveNexusCharacterAbilities.baseAbilities, ...effectiveNexusCharacterAbilities.arsenalAbilities];
    return allAbilities.map(a => `${a.id}:${a.cooldown ?? ''}:${a.maxQuantity ?? ''}`).join(',');
  }, [characterForModal, effectiveNexusCharacterAbilities]);


   useEffect(() => {
    if (characterForModal && (effectiveNexusCharacterAbilities.baseAbilities.length > 0 || effectiveNexusCharacterAbilities.arsenalAbilities.length > 0)) {
      const newMaxCDs: Record<string, number> = {};
      const newCurrentCDs: Record<string, number> = {};
      const newMaxQTs: Record<string, number> = {};
      const newCurrentQTs: Record<string, number> = {};

      const allModalAbilities = [...effectiveNexusCharacterAbilities.baseAbilities, ...effectiveNexusCharacterAbilities.arsenalAbilities];

      allModalAbilities.forEach(ability => {
        if (ability.cooldown) {
          const maxRounds = parseCooldownRounds(String(ability.cooldown));
          if (maxRounds !== undefined) {
            newMaxCDs[ability.id] = maxRounds;
            newCurrentCDs[ability.id] = maxRounds; 
          }
        }
        if (ability.maxQuantity !== undefined) {
          newMaxQTs[ability.id] = ability.maxQuantity;
          newCurrentQTs[ability.id] = ability.maxQuantity; 
        }
      });

      setNexusMaxAbilityCooldowns(newMaxCDs);
      setNexusCurrentAbilityCooldowns(newCurrentCDs);
      setNexusMaxAbilityQuantities(newMaxQTs);
      setNexusCurrentAbilityQuantities(newCurrentQTs);
    } else {
      setNexusMaxAbilityCooldowns({});
      setNexusCurrentAbilityCooldowns({});
      setNexusMaxAbilityQuantities({});
      setNexusCurrentAbilityQuantities({});
    }
  }, [characterForModal, abilityDataStringForEffect, effectiveNexusCharacterAbilities]);


  const handleImageDoubleClick = () => setImageZoomLevel(prev => prev > 1 ? 1 : ZOOM_SCALE_FACTOR);
  const handleEnlargedImageClick = (e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); if (imageZoomLevel > 1) setImageZoomLevel(1); else if (!touchEndX && !touchEndY) setEnlargedImageUrl(null); };
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { setTouchEndX(null); setTouchEndY(null); setTouchStartX(e.targetTouches[0].clientX); setTouchStartY(e.targetTouches[0].clientY); };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { setTouchEndX(e.targetTouches[0].clientX); setTouchEndY(e.targetTouches[0].clientY); };
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) { setTouchStartX(null); setTouchEndX(null); setTouchStartY(null); setTouchEndY(null); return; }
    const deltaX = touchEndX - touchStartX; const deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE * 0.8 && currentNexusArsenal && enlargedImageUrl) {
      if (enlargedImageUrl === currentNexusArsenal.imageUrlFront && currentNexusArsenal.imageUrlBack) setEnlargedImageUrl(currentNexusArsenal.imageUrlBack);
      else if (enlargedImageUrl === currentNexusArsenal.imageUrlBack && currentNexusArsenal.imageUrlFront) setEnlargedImageUrl(currentNexusArsenal.imageUrlFront);
      setImageZoomLevel(1);
    } else if (Math.abs(deltaX) < MAX_TAP_MOVEMENT && Math.abs(deltaY) < MAX_TAP_MOVEMENT) { if (imageZoomLevel > 1) { setImageZoomLevel(1); } else { setEnlargedImageUrl(null); } }
    setTouchStartX(null); setTouchEndX(null); setTouchStartY(null); setTouchEndY(null);
  };
  const openImageModal = (imageUrl: string) => { setEnlargedImageUrl(imageUrl); setImageZoomLevel(1); };

  const handleSelectCharacterForNexus = (character: Character) => {
    setSelectedNexusCharacter(character);
    setPartyMembers([character]); 
    setSelectedCharacterArsenalId(character.selectedArsenalCardId || null);
    setCharacterForModal(character); 
    setNexusSessionMaxHpModifier(0); 
    setNexusSessionMaxSanityModifier(0);
    setNexusSessionMeleeAttackModifier(0);
    setNexusSessionRangedAttackModifier(0);
    setNexusSessionRangedRangeModifier(0);
    setIsCharacterSelectionDialogOpen(false);
    toast({ title: "Character Selected", description: `${character.name} is now active in the Nexus.` });
  };

  const handleNexusNumberedRoll = () => {
    const numDiceVal = parseInt(nexusNumDice, 10);
    const diceSidesVal = parseInt(nexusDiceSides, 10);
    if (isNaN(numDiceVal) || numDiceVal < 1) { toast({ title: "Invalid Input", description: "Number of dice must be at least 1.", variant: "destructive" }); return; }
    if (isNaN(diceSidesVal) || diceSidesVal < 2) { toast({ title: "Invalid Input", description: "Number of sides must be at least 2.", variant: "destructive" }); return; }
    const rolls: number[] = []; let total = 0;
    for (let i = 0; i < numDiceVal; i++) { const roll = Math.floor(Math.random() * diceSidesVal) + 1; rolls.push(roll); total += roll; }
    setNexusLatestRoll({ type: 'numbered', notation: `${numDiceVal}d${diceSidesVal}`, rolls, total });
    setNexusRollKey(prev => prev + 1);
  };

  const handleNexusCombatRoll = () => {
    const numCombat = parseInt(nexusNumCombatDice, 10);
    if (isNaN(numCombat) || numCombat < 1 || numCombat > 12) { toast({ title: "Invalid Input", description: "Number of combat dice must be between 1 and 12.", variant: "destructive" }); return; }
    const rolls: CombatDieFace[] = []; const faceCounts: Record<CombatDieFace, number> = { swordandshield: 0, 'double-sword': 0, blank: 0 };
    for (let i = 0; i < numCombat; i++) { const rollIndex = Math.floor(Math.random() * 6); const face = combatDieFaces[rollIndex]; rolls.push(face); faceCounts[face]++; }
    const summary = `Sword & Shield: ${faceCounts.swordandshield}, Double Sword: ${faceCounts['double-sword']}, Blank: ${faceCounts.blank}`;
    setNexusLatestRoll({ type: 'combat', notation: `${numCombat}x Combat Dice`, rolls, total: summary });
    setNexusRollKey(prev => prev + 1);
  };

  const handleNexusDrawCard = () => {
    if (!nexusSelectedDeckName) { toast({ title: "No Deck Selected", description: "Please select a deck to draw from.", variant: "destructive" }); return; }
    const deck = sampleDecks.find(d => d.name === nexusSelectedDeckName);
    if (!deck || deck.cards.length === 0) { toast({ title: "Deck Issue", description: `Could not find or draw from deck: ${nexusSelectedDeckName}.`, variant: "destructive" }); return; }
    const randomIndex = Math.floor(Math.random() * deck.cards.length); const drawnCard = deck.cards[randomIndex];
    setNexusDrawnCardsHistory(prev => [drawnCard, ...prev].slice(0, 5));
    setNexusCardKey(prev => prev + 1);
    toast({ title: "Card Drawn!", description: `Drew ${drawnCard.name} from ${deck.name}.` });
  };

  const handleNexusStatChange = (stat: StatName, operation: 'increment' | 'decrement') => {
    if (!characterForModal || !effectiveNexusCharacterStats) return; // Use characterForModal
    const delta = operation === 'increment' ? 1 : -1;
    
    const setters: Record<string, React.Dispatch<React.SetStateAction<number | null>>> = { 
        hp: setCurrentNexusHp, 
        sanity: setCurrentNexusSanity, 
        mv: setCurrentNexusMv, 
        def: setCurrentNexusDef,
    };
    const currentValues: Record<string, number | null> = { 
        hp: currentNexusHp, 
        sanity: currentNexusSanity, 
        mv: currentNexusMv, 
        def: currentNexusDef,
    };
    
    const setter = setters[stat]; 
    const currentValue = currentValues[stat];
    
    if (setter && currentValue !== null) { 
        let newValue = currentValue + delta; 
        newValue = Math.max(0, newValue); 
        
        if (stat === 'hp' && effectiveNexusCharacterStats.maxHp !== undefined) {
          const effectiveMaxHp = (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier;
          newValue = Math.min(newValue, effectiveMaxHp);
        } else if (stat === 'sanity' && effectiveNexusCharacterStats.maxSanity !== undefined) {
          const effectiveMaxSanity = (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier;
          newValue = Math.min(newValue, effectiveMaxSanity);
        } else if (stat === 'mv' && effectiveNexusCharacterStats.mv !== undefined) { 
            newValue = Math.min(newValue, effectiveNexusCharacterStats.mv);
        } else if (stat === 'def' && effectiveNexusCharacterStats.def !== undefined) {
            newValue = Math.min(newValue, effectiveNexusCharacterStats.def);
        }
        setter(newValue); 
    }
  };

  const handleNexusSessionMaxStatModifierChange = (statType: 'hp' | 'sanity', delta: number) => {
    if (!characterForModal || !effectiveNexusCharacterStats) return; // Use characterForModal

    if (statType === 'hp') {
      setNexusSessionMaxHpModifier(prevMod => {
        const newMod = prevMod + delta;
        const baseMaxHp = effectiveNexusCharacterStats.maxHp || 1;
        const finalNewMod = (baseMaxHp + newMod < 1) ? (1 - baseMaxHp) : newMod;

        if (currentNexusHp !== null) {
          const finalEffectiveMaxForCapping = Math.max(1, baseMaxHp + finalNewMod);
          if (currentNexusHp > finalEffectiveMaxForCapping) {
            setCurrentNexusHp(finalEffectiveMaxForCapping);
          }
        }
        return finalNewMod;
      });
    } else if (statType === 'sanity') {
      setNexusSessionMaxSanityModifier(prevMod => {
        const newMod = prevMod + delta;
        const baseMaxSanity = effectiveNexusCharacterStats.maxSanity || 1;
        const finalNewMod = (baseMaxSanity + newMod < 1) ? (1 - baseMaxSanity) : newMod;
        
        if (currentNexusSanity !== null) {
          const finalEffectiveMaxForCapping = Math.max(1, baseMaxSanity + finalNewMod);
          if (currentNexusSanity > finalEffectiveMaxForCapping) {
            setCurrentNexusSanity(finalEffectiveMaxForCapping);
          }
        }
        return finalNewMod;
      });
    }
  };

  const handleNexusSessionWeaponStatModifierChange = (
    weaponType: 'melee' | 'ranged',
    statType: 'attack' | 'range',
    delta: number
  ) => {
    if (weaponType === 'melee' && statType === 'attack') {
      setNexusSessionMeleeAttackModifier(prev => Math.max(0, prev + delta));
    } else if (weaponType === 'ranged' && statType === 'attack') {
      setNexusSessionRangedAttackModifier(prev => Math.max(0, prev + delta));
    } else if (weaponType === 'ranged' && statType === 'range') {
      setNexusSessionRangedRangeModifier(prev => Math.max(0, prev + delta));
    }
  };


  const handleIncrementNexusCooldown = (abilityId: string) => { setNexusCurrentAbilityCooldowns(prev => ({ ...prev, [abilityId]: Math.min((prev[abilityId] || 0) + 1, nexusMaxAbilityCooldowns[abilityId] || Infinity) })); };
  const handleDecrementNexusCooldown = (abilityId: string) => { setNexusCurrentAbilityCooldowns(prev => ({ ...prev, [abilityId]: Math.max((prev[abilityId] || 0) - 1, 0) })); };
  const handleIncrementNexusQuantity = (abilityId: string) => { setNexusCurrentAbilityQuantities(prev => ({ ...prev, [abilityId]: Math.min((prev[abilityId] || 0) + 1, nexusMaxAbilityQuantities[abilityId] || Infinity) })); };
  const handleDecrementNexusQuantity = (abilityId: string) => { setNexusCurrentAbilityQuantities(prev => ({ ...prev, [abilityId]: Math.max((prev[abilityId] || 0) - 1, 0) })); };


  const getStatProgressColorClass = (current: number | null, max: number | undefined, statType?: 'hp' | 'sanity' | 'mv' | 'def'): string => {
    if (current === null || max === undefined || max === 0) return '[&>div]:bg-gray-400';
    const percentage = (current / max) * 100;
    if (statType === 'sanity') { if (percentage > 66) return "[&>div]:bg-blue-500"; if (percentage > 33) return "[&>div]:bg-blue-400"; return "[&>div]:bg-red-500"; }
    if (statType === 'def' || statType === 'mv') { if (percentage >= 75) return "[&>div]:bg-green-500"; if (percentage >= 40) return "[&>div]:bg-yellow-500"; return "[&>div]:bg-red-500"; }
    if (percentage <= 33) return '[&>div]:bg-red-500'; if (percentage <= 66) return '[&>div]:bg-yellow-500'; return '[&>div]:bg-green-500';
  };

  const getSkillIcon = (skillId: SkillName): React.ElementType => { const skillDef = skillDefinitions.find(s => s.id === skillId); return skillDef?.icon || Library; };


  return (
    <TooltipProvider>
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Dot className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-semibold">Riddle of the Beast Companion</span>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <span className="text-sm text-muted-foreground">Room:</span>
          <span className="text-sm font-mono text-primary">BEAST_NEXUS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" aria-label="Log Out"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>
      
      <Dialog open={isCharacterSelectionDialogOpen} onOpenChange={setIsCharacterSelectionDialogOpen}>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col space-y-6">
            {/* Dice Roller Card */}
            <Card>
                <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Dices className="mr-2 h-5 w-5 text-primary" />Dice Roller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                    <Label className="text-sm">Combat Dice</Label>
                    <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label htmlFor="nexusNumCombatDice" className="text-xs">Qty (1-12)</Label>
                        <Input id="nexusNumCombatDice" type="number" value={nexusNumCombatDice} onChange={(e) => setNexusNumCombatDice(e.target.value)} min="1" max="12" className="h-8" />
                    </div>
                    <Button onClick={handleNexusCombatRoll} size="sm" className="h-8 px-2"><ChevronsRight className="h-4 w-4" /> Roll</Button>
                    </div>
                </div>
                <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                    <Label className="text-sm">Numbered Dice</Label>
                    <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label htmlFor="nexusNumDice" className="text-xs">Qty</Label>
                        <Input id="nexusNumDice" type="number" value={nexusNumDice} onChange={(e) => setNexusNumDice(e.target.value)} min="1" className="h-8" />
                    </div>
                    <span className="pb-2">d</span>
                    <div className="flex-1">
                        <Label htmlFor="nexusDiceSides" className="text-xs">Sides</Label>
                        <Input id="nexusDiceSides" type="number" value={nexusDiceSides} onChange={(e) => setNexusDiceSides(e.target.value)} min="2" className="h-8" />
                    </div>
                    <Button onClick={handleNexusNumberedRoll} size="sm" className="h-8 px-2"><ChevronsRight className="h-4 w-4" /> Roll</Button>
                    </div>
                </div>
                {nexusLatestRoll && (
                    <Card key={nexusRollKey} className="mt-2 bg-muted/30 border-primary/50 shadow-sm animate-in fade-in duration-300">
                    <CardHeader className="p-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                        <span>Latest Roll:</span>
                        <Badge variant="secondary" className="text-xs">{nexusLatestRoll.notation}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 text-center">
                        {nexusLatestRoll.type === 'numbered' && (
                        <>
                            <div className="flex flex-wrap gap-1 justify-center mb-1">
                            {(nexusLatestRoll.rolls as number[]).map((roll, idx) => (
                                <Badge key={idx} variant="default" className="text-md bg-primary/20 text-primary-foreground border border-primary">{roll}</Badge>
                            ))}
                            </div>
                            <p className="font-semibold text-primary">Total: {nexusLatestRoll.total}</p>
                        </>
                        )}
                        {nexusLatestRoll.type === 'combat' && (
                        <>
                            <div className="flex flex-wrap gap-1 justify-center mb-1">
                            {(nexusLatestRoll.rolls as CombatDieFace[]).map((roll, idx) => (
                                <CombatDieFaceImage key={idx} face={roll} size={48} />
                            ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{nexusLatestRoll.total as string}</p>
                        </>
                        )}
                    </CardContent>
                    </Card>
                )}
                </CardContent>
            </Card>

            {/* Character Panel */}
            <div className={cn("flex-shrink-0 flex bg-card rounded-lg p-4 shadow-md w-full", selectedNexusCharacter ? "flex-col items-start justify-start" : "flex-col items-center justify-center min-h-[200px]")}>
            {selectedNexusCharacter && effectiveNexusCharacterStats ? (
                <div className="w-full space-y-3">
                  <div className="flex items-start gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                <button type="button" onClick={() => { setCharacterForModal(selectedNexusCharacter); setIsCharacterCardModalOpen(true); }} aria-label={`View details for ${selectedNexusCharacter.name}`}>
                                    <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-primary hover:ring-2 hover:ring-accent cursor-pointer">
                                    <AvatarImage src={selectedNexusCharacter.imageUrl || `https://placehold.co/100x100.png?text=${selectedNexusCharacter.name.substring(0,1)}`} alt={selectedNexusCharacter.name} data-ai-hint="selected character avatar"/>
                                    <AvatarFallback>{selectedNexusCharacter.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>View Details for {selectedNexusCharacter.name}</p>
                        </TooltipContent>
                    </Tooltip>
                    <div className="flex-grow">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">{selectedNexusCharacter.name}</h2>
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => setIsCharacterSelectionDialogOpen(true)}>Change Character</Button>
                        </DialogTrigger>
                    </div>
                  </div>


                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border p-3 rounded-md bg-background/30">
                        {/* HP Tracker */}
                        {currentNexusHp !== null && effectiveNexusCharacterStats.maxHp !== undefined && (
                            <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Heart className="mr-1.5 h-3 w-3 text-red-500" />HP</Label>
                                <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'decrement')} disabled={currentNexusHp === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={currentNexusHp} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'increment')} disabled={currentNexusHp >= ((effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier)}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(currentNexusHp / Math.max(1, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusHp, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier, 'hp'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusHp} / {(effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier}</p>
                            </div>
                        )}
                        {/* Sanity Tracker */}
                        {currentNexusSanity !== null && effectiveNexusCharacterStats.maxSanity !== undefined && (
                            <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Brain className="mr-1.5 h-3 w-3 text-blue-400" />Sanity</Label>
                                <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'decrement')} disabled={currentNexusSanity === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={currentNexusSanity} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'increment')} disabled={currentNexusSanity >= ((effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier)}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(currentNexusSanity / Math.max(1, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusSanity, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier, 'sanity'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusSanity} / {(effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier}</p>
                            </div>
                        )}
                        {/* MV Display */}
                        {currentNexusMv !== null && effectiveNexusCharacterStats.mv !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Footprints className="mr-1.5 h-3 w-3 text-green-500" />MV</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'decrement')} disabled={currentNexusMv === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={currentNexusMv} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'increment')} disabled={currentNexusMv === effectiveNexusCharacterStats.mv}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                                </div>
                                <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusMv} / {effectiveNexusCharacterStats.mv}</p>
                            </div>
                        )}
                        {/* DEF Display */}
                        {currentNexusDef !== null && effectiveNexusCharacterStats.def !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Shield className="mr-1.5 h-3 w-3 text-gray-400" />DEF</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'decrement')} disabled={currentNexusDef === 0}><UserMinus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={currentNexusDef} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'increment')} disabled={currentNexusDef === effectiveNexusCharacterStats.def}><UserPlus className="h-2.5 w-2.5" /></Button>
                                </div>
                                </div>
                                <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusDef} / {effectiveNexusCharacterStats.def}</p>
                            </div>
                        )}
                    </div>

                    {/* Arsenal Selection Section */}
                    <div className="mt-4 pt-3 border-t border-muted-foreground/20">
                        <Label htmlFor="nexusArsenalSelect" className="text-md font-medium text-accent flex items-center mb-1"><Package className="mr-2 h-5 w-5" /> Selected Arsenal</Label>
                        {criticalArsenalError ? (
                            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>{criticalArsenalError.name}</AlertTitle><AlertDescription>{criticalArsenalError.description} {criticalArsenalError.items?.[0]?.abilityName}</AlertDescription></Alert>
                        ) : (
                        <Select value={selectedCharacterArsenalId || "none"} onValueChange={(value) => setSelectedCharacterArsenalId(value === "none" ? null : value)} disabled={!arsenalCards || arsenalCards.length === 0 || (arsenalCards.length === 1 && arsenalCards[0].id.startsWith('error-'))}>
                            <SelectTrigger id="nexusArsenalSelect"><SelectValue placeholder="No Arsenal Equipped..." /></SelectTrigger>
                            <SelectContent><SelectItem value="none">None</SelectItem>{arsenalCards.filter(card => !card.id.startsWith('error-')).map(card => (<SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>))}</SelectContent>
                        </Select>
                        )}
                        {currentNexusArsenal && (
                            <div className="mt-3 p-3 rounded-md border border-accent/50 bg-card/50">
                                 <h4 className="text-sm font-semibold text-accent">{currentNexusArsenal.name}</h4>
                                {currentNexusArsenal.description && <p className="text-xs text-muted-foreground mb-2">{currentNexusArsenal.description}</p>}
                                {(currentNexusArsenal.imageUrlFront || currentNexusArsenal.imageUrlBack) && (
                                    <div className="mt-2 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-2">
                                        {currentNexusArsenal.imageUrlFront && (
                                        <button type="button" onClick={() => openImageModal(currentNexusArsenal.imageUrlFront!)} className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`View front of ${currentNexusArsenal.name} card`}>
                                            <Image src={currentNexusArsenal.imageUrlFront} alt={`${currentNexusArsenal.name} - Front`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card front" />
                                        </button>
                                        )}
                                        {currentNexusArsenal.imageUrlBack && (
                                        <button type="button" onClick={() => openImageModal(currentNexusArsenal.imageUrlBack!)} className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`View back of ${currentNexusArsenal.name} card`}>
                                            <Image src={currentNexusArsenal.imageUrlBack} alt={`${currentNexusArsenal.name} - Back`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card back" />
                                        </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
              ) : (
                <>
                  <UserCircle2 className="h-20 w-20 md:h-24 md:w-24 text-muted-foreground mb-3 md:mb-4" />
                  <h2 className="text-lg md:text-xl font-semibold text-muted-foreground">No Character Active</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">Choose a character to manage for this session.</p>
                  <DialogTrigger asChild>
                     <Button variant="default">Select Character</Button>
                  </DialogTrigger>
                </>
              )}
            </div>
            
            {/* Card Decks Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center"><Layers3 className="mr-2 h-5 w-5 text-primary" />Card Decks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2 p-2 border border-muted-foreground/20 rounded-md">
                        <Label htmlFor="nexusDeckSelect" className="text-sm">Select Deck</Label>
                        <Select value={nexusSelectedDeckName} onValueChange={setNexusSelectedDeckName}>
                            <SelectTrigger id="nexusDeckSelect" className="h-8"><SelectValue placeholder="Choose a deck..." /></SelectTrigger>
                            <SelectContent>{sampleDecks.map(deck => (<SelectItem key={deck.name} value={deck.name} className="text-xs">{deck.name} ({deck.cards.length} cards)</SelectItem>))}</SelectContent>
                        </Select>
                        <Button onClick={handleNexusDrawCard} size="sm" className="w-full h-8 mt-2" disabled={!nexusSelectedDeckName}><BookOpen className="mr-2 h-4 w-4" /> Draw Card</Button>
                    </div>
                    {nexusDrawnCardsHistory.length > 0 && nexusDrawnCardsHistory[0] && (
                    <div className="mt-2">
                        <h4 className="text-sm font-semibold mb-1 text-muted-foreground text-center">Latest Card Drawn</h4>
                        <GameCardDisplay card={nexusDrawnCardsHistory[0]} key={`${nexusDrawnCardsHistory[0].id}-${nexusCardKey}`} size="medium" onClick={() => nexusDrawnCardsHistory[0].imageUrl && openImageModal(nexusDrawnCardsHistory[0].imageUrl)} isButton={!!nexusDrawnCardsHistory[0].imageUrl} className="mx-auto animate-in fade-in duration-300" imageOnly={true} />
                    </div>
                    )}
                    {nexusDrawnCardsHistory.length > 0 && (
                        <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground text-center">Previously Drawn</h4>
                        {nexusDrawnCardsHistory.slice(1).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                            {nexusDrawnCardsHistory.slice(1).map((card, idx) => (
                                <GameCardDisplay key={`${card.id}-hist-${idx}`} card={card} size="small" onClick={() => card.imageUrl && openImageModal(card.imageUrl)} isButton={!!card.imageUrl} className="w-full" imageOnly={true} />
                            ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center">Draw more cards to see history.</p>
                        )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Party Members Card */}
            <Card>
                <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary" />Party Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                {partyMembers.length === 0 && !selectedNexusCharacter ? (
                    <p className="text-sm text-muted-foreground">No character active in Nexus.</p>
                ) : (
                    (selectedNexusCharacter ? [selectedNexusCharacter] : partyMembers).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                        <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.substring(0,1)}`} alt={member.name} data-ai-hint="party member avatar"/>
                            <AvatarFallback>{member.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div><p className="text-sm font-medium">{member.name}</p></div>
                        </div>
                    </div>
                    ))
                )}
                </CardContent>
            </Card>
        </main>

        {/* Character Selection Dialog Content */}
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Select Character for Nexus</DialogTitle>
              <DialogDescription>Choose a character template to use in this session.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-2">
                {charactersData.map((char) => (
                  <Button key={char.id} variant="ghost" className="w-full justify-start p-2 h-auto" onClick={() => handleSelectCharacterForNexus(char)}>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={char.imageUrl || `https://placehold.co/40x40.png?text=${char.name.substring(0,1)}`} alt={char.name} data-ai-hint="character avatar"/>
                      <AvatarFallback>{char.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {char.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>
      

      {/* Character Details Modal */}
      <Dialog 
        open={isCharacterCardModalOpen} 
        onOpenChange={(open) => {
          setIsCharacterCardModalOpen(open);
          if (!open) {
            setIsCharacterSelectionDialogOpen(false); 
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          {characterForModal && effectiveNexusCharacterStats && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary text-center">{characterForModal.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] p-1">
                <div className="space-y-4 p-2">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg">
                    <AvatarImage src={characterForModal.imageUrl || `https://placehold.co/128x128.png`} alt={characterForModal.name} data-ai-hint="character avatar large"/>
                    <AvatarFallback className="text-4xl bg-muted">{characterForModal.name.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <Separator />
                  <h4 className="text-lg font-semibold text-primary flex items-center"><Info className="mr-2 h-5 w-5" /> Core Stats</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {currentNexusHp !== null && effectiveNexusCharacterStats.maxHp !== undefined && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Heart className="mr-1.5 h-3 w-3 text-red-500" />HP</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'decrement')} disabled={currentNexusHp === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={currentNexusHp} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('hp', 'increment')} disabled={currentNexusHp >= Math.max(1, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier)}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(currentNexusHp / Math.max(1, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusHp, Math.max(1, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier), 'hp'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusHp} / {Math.max(1, (effectiveNexusCharacterStats.maxHp || 0) + nexusSessionMaxHpModifier)}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Label htmlFor="nexusModalMaxMod-hp" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('hp', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-hp" type="number" value={nexusSessionMaxHpModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('hp', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                        </div>
                    )}
                    {currentNexusSanity !== null && effectiveNexusCharacterStats.maxSanity !== undefined && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Brain className="mr-1.5 h-3 w-3 text-blue-400" />Sanity</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'decrement')} disabled={currentNexusSanity === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={currentNexusSanity} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('sanity', 'increment')} disabled={currentNexusSanity >= Math.max(1, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier)}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(currentNexusSanity / Math.max(1, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusSanity, Math.max(1, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier), 'sanity'))} />
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusSanity} / {Math.max(1, (effectiveNexusCharacterStats.maxSanity || 0) + nexusSessionMaxSanityModifier)}</p>
                             <div className="flex items-center gap-1 mt-1">
                                <Label htmlFor="nexusModalMaxMod-sanity" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('sanity', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-sanity" type="number" value={nexusSessionMaxSanityModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('sanity', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                        </div>
                    )}
                    {currentNexusMv !== null && effectiveNexusCharacterStats.mv !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <Label className="flex items-center text-xs font-medium"><Footprints className="mr-1.5 h-3 w-3 text-green-500" />MV</Label>
                         <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'decrement')} disabled={currentNexusMv === 0}><Minus className="h-2.5 w-2.5" /></Button>
                            <Input type="number" readOnly value={currentNexusMv} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('mv', 'increment')} disabled={currentNexusMv === effectiveNexusCharacterStats.mv}><Plus className="h-2.5 w-2.5" /></Button>
                          </div>
                        </div>
                        <Progress value={(currentNexusMv / (effectiveNexusCharacterStats.mv || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusMv, effectiveNexusCharacterStats.mv, 'mv'))} />
                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusMv} / {effectiveNexusCharacterStats.mv}</p>
                      </div>
                    )}
                    {currentNexusDef !== null && effectiveNexusCharacterStats.def !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <Label className="flex items-center text-xs font-medium"><Shield className="mr-1.5 h-3 w-3 text-gray-400" />DEF</Label>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'decrement')} disabled={currentNexusDef === 0}><Minus className="h-2.5 w-2.5" /></Button>
                            <Input type="number" readOnly value={currentNexusDef} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusStatChange('def', 'increment')} disabled={currentNexusDef === effectiveNexusCharacterStats.def}><Plus className="h-2.5 w-2.5" /></Button>
                          </div>
                        </div>
                        <Progress value={(currentNexusDef / (effectiveNexusCharacterStats.def || 1)) * 100} className={cn("h-1", getStatProgressColorClass(currentNexusDef, effectiveNexusCharacterStats.def, 'def'))} />
                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentNexusDef} / {effectiveNexusCharacterStats.def}</p>
                      </div>
                    )}
                  </div>

                  {(effectiveNexusMeleeWeapon || effectiveNexusRangedWeapon) && (
                    <>
                      <Separator />
                      <h4 className="text-lg font-semibold text-primary flex items-center"><Swords className="mr-2 h-5 w-5" /> Weapons</h4>
                      <div className="space-y-3 text-sm">
                        {effectiveNexusMeleeWeapon && (
                          <div className="p-2 bg-muted/20 rounded-md">
                            <p className="font-medium text-foreground flex items-center"><MeleeIcon className="mr-2 h-4 w-4 text-orange-400"/> {effectiveNexusMeleeWeapon.name} (Melee)</p>
                            <p>ATK: {effectiveNexusMeleeWeapon.attack}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Label htmlFor="nexusModalMeleeAtkMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>ATK Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('melee', 'attack', -1)} disabled={nexusSessionMeleeAttackModifier <= 0 && effectiveNexusMeleeWeapon.attack === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMeleeAtkMod" type="number" value={nexusSessionMeleeAttackModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('melee', 'attack', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                            {effectiveNexusMeleeWeapon.flavorText && <p className="text-xs text-muted-foreground mt-1">{effectiveNexusMeleeWeapon.flavorText}</p>}
                          </div>
                        )}
                        {effectiveNexusRangedWeapon && (
                          <div className="p-2 bg-muted/20 rounded-md">
                            <p className="font-medium text-foreground flex items-center"><Crosshair className="mr-2 h-4 w-4 text-cyan-400"/> {effectiveNexusRangedWeapon.name} (Ranged)</p>
                            <p>ATK: {effectiveNexusRangedWeapon.attack} / RNG: {effectiveNexusRangedWeapon.range}</p>
                             <div className="flex items-center gap-1 mt-1">
                                <Label htmlFor="nexusModalRangedAtkMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>ATK Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'attack', -1)} disabled={nexusSessionRangedAttackModifier <= 0 && effectiveNexusRangedWeapon.attack === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalRangedAtkMod" type="number" value={nexusSessionRangedAttackModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'attack', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Label htmlFor="nexusModalRangedRngMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>RNG Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'range', -1)} disabled={nexusSessionRangedRangeModifier <=0 && effectiveNexusRangedWeapon.range === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalRangedRngMod" type="number" value={nexusSessionRangedRangeModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'range', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                            {effectiveNexusRangedWeapon.flavorText && <p className="text-xs text-muted-foreground mt-1">{effectiveNexusRangedWeapon.flavorText}</p>}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {arsenalProvidedEquipment.length > 0 && (
                    <>
                      <Separator />
                      <h4 className="text-lg font-semibold text-primary flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Arsenal Weapons & Gear</h4>
                      <div className="space-y-2 text-sm">
                        {arsenalProvidedEquipment.map(item => (
                          <Card key={item.id} className="p-2 bg-muted/20">
                            <p className="font-medium text-foreground">{item.abilityName}</p>
                            {item.parsedWeaponStats?.attack !== undefined && (
                              <p className="text-xs">
                                ATK: {item.parsedWeaponStats.attack}
                                {item.parsedWeaponStats.range !== undefined && ` / RNG: ${item.parsedWeaponStats.range}`}
                              </p>
                            )}
                            {item.parsedStatModifiers && item.parsedStatModifiers.length > 0 && (
                                <p className="text-xs">Mods: {item.parsedStatModifiers.map(mod => `${mod.targetStat.toUpperCase()}: ${mod.value > 0 ? '+' : ''}${mod.value}`).join(', ')}</p>
                            )}
                            {(item.itemDescription || item.effect) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.itemDescription || item.effect}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {(effectiveNexusCharacterAbilities.baseAbilities.length > 0 || effectiveNexusCharacterAbilities.arsenalAbilities.length > 0) && (
                     <> 
                        <Separator /> 
                        
                        {effectiveNexusCharacterAbilities.baseAbilities.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-lg font-semibold text-primary flex items-center"><BookMarked className="mr-2 h-5 w-5" /> Character Abilities:</h5>
                                {effectiveNexusCharacterAbilities.baseAbilities.map(ability => ( 
                                    <AbilityCard 
                                        key={`modal-base-ability-${ability.id}`} 
                                        ability={ability} 
                                        currentCooldown={nexusCurrentAbilityCooldowns[ability.id]} 
                                        maxCooldown={nexusMaxAbilityCooldowns[ability.id]} 
                                        onIncrementCooldown={() => handleIncrementNexusCooldown(ability.id)} 
                                        onDecrementCooldown={() => handleDecrementNexusCooldown(ability.id)} 
                                        currentQuantity={nexusCurrentAbilityQuantities[ability.id]} 
                                        maxQuantity={nexusMaxAbilityQuantities[ability.id]} 
                                        onIncrementQuantity={() => handleIncrementNexusQuantity(ability.id)} 
                                        onDecrementQuantity={() => handleDecrementNexusQuantity(ability.id)} 
                                    /> 
                                ))} 
                            </div>
                        )}

                        {effectiveNexusCharacterAbilities.arsenalAbilities.length > 0 && (
                            <div className="space-y-2 mt-3">
                                <h5 className="text-lg font-semibold text-primary flex items-center"><Sparkles className="mr-2 h-5 w-5" /> Arsenal-Granted Abilities:</h5>
                                {effectiveNexusCharacterAbilities.arsenalAbilities.map(ability => ( 
                                    <AbilityCard 
                                        key={`modal-arsenal-ability-${ability.id}`} 
                                        ability={ability} 
                                        currentCooldown={nexusCurrentAbilityCooldowns[ability.id]} 
                                        maxCooldown={nexusMaxAbilityCooldowns[ability.id]} 
                                        onIncrementCooldown={() => handleIncrementNexusCooldown(ability.id)} 
                                        onDecrementCooldown={() => handleDecrementNexusCooldown(ability.id)} 
                                        currentQuantity={nexusCurrentAbilityQuantities[ability.id]} 
                                        maxQuantity={nexusMaxAbilityQuantities[ability.id]} 
                                        onIncrementQuantity={() => handleIncrementNexusQuantity(ability.id)} 
                                        onDecrementQuantity={() => handleDecrementNexusQuantity(ability.id)} 
                                    /> 
                                ))} 
                            </div>
                        )}
                    </>
                  )}
                  {effectiveNexusCharacterAbilities.baseAbilities.length === 0 && effectiveNexusCharacterAbilities.arsenalAbilities.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-3">No abilities defined.</p>
                  )}

                  {characterForModal.skills && Object.values(characterForModal.skills).some(val => val && val > 0) && (
                    <> 
                      <Separator /> 
                      <h4 className="text-lg font-semibold text-primary flex items-center"><ListChecks className="mr-2 h-5 w-5" /> Skills</h4>
                      <div className="space-y-1 text-sm"> {skillDefinitions.map(skillDef => { const skillValue = characterForModal.skills?.[skillDef.id as SkillName] || 0; if (skillValue > 0) { const IconComponent = getSkillIcon(skillDef.id as SkillName); return ( <div key={skillDef.id} className="flex items-center justify-between p-1 bg-muted/20 rounded-sm"> <span className="flex items-center"><IconComponent className="mr-2 h-4 w-4 text-muted-foreground" /> {skillDef.label}</span> <span>{skillValue}</span> </div> ); } return null; })} </div>
                    </>
                  )}

                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Enlargement Modal */}
      <Dialog open={!!enlargedImageUrl} onOpenChange={(isOpen) => { if (!isOpen) setEnlargedImageUrl(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center" onInteractOutside={(e) => { if (imageZoomLevel > 1) { setImageZoomLevel(1); e.preventDefault(); }}}>
          {enlargedImageUrl && (
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden" 
              onDoubleClick={handleImageDoubleClick} 
              onTouchStart={handleTouchStart} 
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd} 
              onClick={handleEnlargedImageClick}
              style={{ cursor: imageZoomLevel > 1 ? 'zoom-out' : (enlargedImageUrl ? 'zoom-in' : 'default')}}
            >
              <Image 
                src={enlargedImageUrl} 
                alt="Enlarged card" 
                fill 
                style={{ 
                  objectFit: 'contain', 
                  transform: `scale(${imageZoomLevel})`, 
                  transition: 'transform 0.2s ease-out', 
                  transformOrigin: 'center' 
                }} 
                className={cn("max-w-full max-h-full")}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

