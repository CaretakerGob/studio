
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
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel, // Added DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
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
  Briefcase, 
  Crosshair,
  Coins,
  Save,
  RotateCcw,
  UploadCloud, 
  Trash2, 
  Loader2,
  Droplets,
  AlertTriangle,
  UserRoundPlus,
  UserRoundX,
  CheckCircle,
  Image as LucideImage,
  Eye, 
} from "lucide-react";
import { CombatDieFaceImage, type CombatDieFace } from '@/components/dice-roller/combat-die-face-image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { charactersData, type Character, type CharacterStats, type StatName, skillDefinitions, type SkillName, type Ability as CharacterAbility, type AbilityType, type Weapon, type RangedWeapon } from '@/components/character-sheet/character-sheet-ui';
import { sampleDecks, type GameCard } from '@/components/card-generator/card-generator-ui';
import { GameCardDisplay } from '@/components/card-generator/game-card-display';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ArsenalCard as ActualArsenalCard, ArsenalItem } from '@/types/arsenal';
import { AbilityCard } from '@/components/character-sheet/ability-card';
import { useAuth } from '@/context/auth-context'; 
import { db, auth } from '@/lib/firebase'; 
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore"; 
import type { SavedNexusState, PartyMemberSavedState } from '@/types/nexus';


interface NexusRollResult {
  type: 'numbered' | 'combat';
  notation: string;
  rolls: (number | CombatDieFace)[];
  total?: number | string;
}

const combatDieFaces: CombatDieFace[] = ['swordandshield', 'swordandshield', 'swordandshield', 'double-sword', 'blank', 'blank'];
const NEXUS_HEMORRHAGE_THRESHOLD = 3;
const MAX_TEAM_SIZE = 4; 

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

interface TeamMemberSessionSpecificData { 
  selectedArsenalId: string | null;
  currentHp: number;
  currentSanity: number;
  currentMv: number;
  currentDef: number;
  sessionBleedPoints: number;
  sessionMaxHpModifier: number;
  sessionMaxSanityModifier: number;
  sessionMvModifier: number;
  sessionDefModifier: number;
  sessionMeleeAttackModifier: number;
  sessionRangedAttackModifier: number;
  sessionRangedRangeModifier: number;
  abilityCooldowns: Record<string, number>;
  abilityQuantities: Record<string, number>;
}

interface EnlargedModalContent {
  type: 'avatar' | 'arsenal';
  frontUrl: string;
  backUrl?: string;
  currentDisplayUrl: string;
  altText: string;
}
type EnlargedModalContentType = EnlargedModalContent;


export function HuntersNexusUI({ arsenalCards = [] }: HuntersNexusUIProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth(); 

  const [nexusNumCombatDice, setNexusNumCombatDice] = useState('1');
  const [nexusNumDice, setNexusNumDice] = useState('1');
  const [nexusDiceSides, setNexusDiceSides] = useState('6');
  const [nexusLatestRoll, setNexusLatestRoll] = useState<NexusRollResult | null>(null);
  const [nexusRollKey, setNexusRollKey] = useState(0);

  const [teamMembers, setTeamMembers] = useState<Character[]>([]); 
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [teamSessionData, setTeamSessionData] = useState<Record<string, TeamMemberSessionSpecificData>>({}); 
  
  const [sessionCrypto, setSessionCrypto] = useState<number>(0);
  
  const [isCharacterManagementDialogOpen, setIsCharacterManagementDialogOpen] = useState(false);
  
  const [nexusDrawnCardsHistory, setNexusDrawnCardsHistory] = useState<GameCard[]>([]);
  const [nexusSelectedDeckName, setNexusSelectedDeckName] = useState<string | undefined>(undefined);
  const [nexusCardKey, setNexusCardKey] = useState(0);

  const [enlargedModalContent, setEnlargedModalContent] = useState<EnlargedModalContentType | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);

  const [isCharacterCardModalOpen, setIsCharacterCardModalOpen] = useState(false);

  const [isSaveNexusDialogOpen, setIsSaveNexusDialogOpen] = useState(false);
  const [saveNexusName, setSaveNexusName] = useState("");
  const [isSavingNexus, setIsSavingNexus] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const [isLoadNexusDialogOpen, setIsLoadNexusDialogOpen] = useState(false);
  const [savedNexusSessions, setSavedNexusSessions] = useState<SavedNexusState[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SavedNexusState | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // State for window visibility
  const [isCryptoVisible, setIsCryptoVisible] = useState(true);
  const [isDiceRollerVisible, setIsDiceRollerVisible] = useState(true);
  const [isCardDecksVisible, setIsCardDecksVisible] = useState(true);
  const [isCoreStatsVisible, setIsCoreStatsVisible] = useState(true); 

  // State for compact card stat visibility
  const [isNexusMvVisible, setIsNexusMvVisible] = useState(true);
  const [isNexusDefVisible, setIsNexusDefVisible] = useState(true);
  const [isNexusBleedVisible, setIsNexusBleedVisible] = useState(true);
  const [isNexusMeleeAttackVisible, setIsNexusMeleeAttackVisible] = useState(false); // Default hidden
  const [isNexusRangedAttackVisible, setIsNexusRangedAttackVisible] = useState(false); // Default hidden


  const activeCharacterBase = useMemo(() => {
    if (!activeCharacterId) return null;
    return teamMembers.find(p => p.id === activeCharacterId) || null; 
  }, [activeCharacterId, teamMembers]); 

  const activeCharacterSessionData = useMemo(() => {
    if (!activeCharacterId) return null;
    return teamSessionData[activeCharacterId] || null; 
  }, [activeCharacterId, teamSessionData]); 


  const criticalArsenalError = useMemo(() => {
    if (!arsenalCards || arsenalCards.length === 0) return null;
    return arsenalCards.find(card => card.id === 'error-critical-arsenal');
  }, [arsenalCards]);

  const currentNexusArsenal = useMemo(() => {
    if (!activeCharacterSessionData?.selectedArsenalId || !arsenalCards || arsenalCards.length === 0) {
      return null;
    }
    const card = arsenalCards.find(c => c.id === activeCharacterSessionData.selectedArsenalId);
    if (!card || card.id.startsWith('error-')) {
      return null;
    }
    return card;
  }, [activeCharacterSessionData?.selectedArsenalId, arsenalCards]);


  const calculateEffectiveStatsForMember = useCallback((memberId: string): CharacterStats | null => {
    const baseCharacter = teamMembers.find(p => p.id === memberId); 
    const sessionData = teamSessionData[memberId]; 
    if (!baseCharacter || !sessionData) return null;

    let calculatedStats: CharacterStats = JSON.parse(JSON.stringify(baseCharacter.baseStats || { hp: 1, maxHp: 1, mv: 1, def: 1, sanity: 1, maxSanity: 1, meleeAttack: 0, rangedAttack: 0, rangedRange: 0 }));
    const memberArsenal = arsenalCards.find(ac => ac.id === sessionData.selectedArsenalId && !ac.id.startsWith('error-'));

    if (memberArsenal) {
      calculatedStats.maxHp = (calculatedStats.maxHp || 1) + (memberArsenal.maxHpMod || 0);
      calculatedStats.mv = (calculatedStats.mv || 0) + (memberArsenal.mvMod || 0);
      calculatedStats.def = (calculatedStats.def || 0) + (memberArsenal.defMod || 0);
      calculatedStats.maxSanity = (calculatedStats.maxSanity || 1) + (memberArsenal.maxSanityMod || 0);
      calculatedStats.meleeAttack = (calculatedStats.meleeAttack || 0) + (memberArsenal.meleeAttackMod || 0);
      calculatedStats.rangedAttack = (calculatedStats.rangedAttack || 0) + (memberArsenal.rangedAttackMod || 0);
      calculatedStats.rangedRange = (calculatedStats.rangedRange || 0) + (memberArsenal.rangedRangeMod || 0);
      
      if (memberArsenal.items) {
        memberArsenal.items.forEach(item => {
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
    
    calculatedStats.maxHp = (calculatedStats.maxHp || 1) + sessionData.sessionMaxHpModifier;
    calculatedStats.maxSanity = (calculatedStats.maxSanity || 1) + sessionData.sessionMaxSanityModifier;
    calculatedStats.mv = (calculatedStats.mv || 0) + sessionData.sessionMvModifier;
    calculatedStats.def = (calculatedStats.def || 0) + sessionData.sessionDefModifier;
    calculatedStats.meleeAttack = (calculatedStats.meleeAttack || 0) + sessionData.sessionMeleeAttackModifier;
    calculatedStats.rangedAttack = (calculatedStats.rangedAttack || 0) + sessionData.sessionRangedAttackModifier;
    calculatedStats.rangedRange = (calculatedStats.rangedRange || 0) + sessionData.sessionRangedRangeModifier;


    calculatedStats.hp = sessionData.currentHp;
    calculatedStats.sanity = sessionData.currentSanity;
    
    if (calculatedStats.hp > calculatedStats.maxHp) calculatedStats.hp = calculatedStats.maxHp;
    if (calculatedStats.sanity > calculatedStats.maxSanity) calculatedStats.sanity = calculatedStats.maxSanity;

    calculatedStats.hp = Math.max(0, calculatedStats.hp);
    calculatedStats.maxHp = Math.max(1, calculatedStats.maxHp);
    calculatedStats.mv = Math.max(0, calculatedStats.mv);
    calculatedStats.def = Math.max(0, calculatedStats.def);
    calculatedStats.sanity = Math.max(0, calculatedStats.sanity);
    calculatedStats.maxSanity = Math.max(1, calculatedStats.maxSanity);
    calculatedStats.meleeAttack = Math.max(0, calculatedStats.meleeAttack || 0);
    calculatedStats.rangedAttack = Math.max(0, calculatedStats.rangedAttack || 0);
    calculatedStats.rangedRange = Math.max(0, calculatedStats.rangedRange || 0);


    return calculatedStats;
  }, [teamMembers, teamSessionData, arsenalCards]); 

  const effectiveNexusCharacterStats: CharacterStats | null = useMemo(() => {
      if (!activeCharacterId) return null;
      return calculateEffectiveStatsForMember(activeCharacterId);
  }, [activeCharacterId, calculateEffectiveStatsForMember]);


 const effectiveNexusCharacterAbilities = useMemo(() => {
    const result: { baseAbilities: CharacterAbility[], arsenalAbilities: CharacterAbility[] } = {
      baseAbilities: [],
      arsenalAbilities: [],
    };

    if (!activeCharacterBase) return result;

    result.baseAbilities = activeCharacterBase.abilities ? [...activeCharacterBase.abilities] : [];
    
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
  }, [activeCharacterBase, currentNexusArsenal]);

  const abilityDataStringForEffect = useMemo(() => {
    if (!activeCharacterBase || (!effectiveNexusCharacterAbilities.baseAbilities.length && !effectiveNexusCharacterAbilities.arsenalAbilities.length)) return '';
    const allAbilities = [...effectiveNexusCharacterAbilities.baseAbilities, ...effectiveNexusCharacterAbilities.arsenalAbilities];
    allAbilities.sort((a, b) => a.id.localeCompare(b.id));
    return allAbilities.map(a => `${a.id}:${a.cooldown ?? ''}:${a.maxQuantity ?? ''}`).join(',');
  }, [activeCharacterBase, effectiveNexusCharacterAbilities]);


  const characterDefaultMeleeWeaponForNexus = useMemo(() => {
      if (!activeCharacterBase) return undefined;
      const template = charactersData.find(c => c.id === (activeCharacterBase.templateId || activeCharacterBase.id));
      return template?.meleeWeapon
          ? { ...template.meleeWeapon }
          : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };
  }, [activeCharacterBase]);

  const characterDefaultRangedWeaponForNexus = useMemo(() => {
      if (!activeCharacterBase) return undefined;
      const template = charactersData.find(c => c.id === (activeCharacterBase.templateId || activeCharacterBase.id));
      return template?.rangedWeapon
          ? { ...template.rangedWeapon } as RangedWeapon
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" } as RangedWeapon;
  }, [activeCharacterBase]);

  const effectiveNexusMeleeWeapon = useMemo(() => {
      if (!activeCharacterBase || !activeCharacterSessionData) return undefined;
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
        weaponToDisplay.attack = Math.max(0, (weaponToDisplay.attack || 0) + activeCharacterSessionData.sessionMeleeAttackModifier);
      }

      const template = charactersData.find(c => c.id === (activeCharacterBase.templateId || activeCharacterBase.id));
      if (weaponToDisplay?.name === "Fists" && weaponToDisplay.attack === (1 + activeCharacterSessionData.sessionMeleeAttackModifier) && 
          !template?.meleeWeapon?.name &&
          !currentNexusArsenal?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (!i.parsedWeaponStats?.range || i.parsedWeaponStats.range <= 1)) &&
          !currentNexusArsenal?.meleeAttackMod &&
          activeCharacterBase.templateId !== 'custom'
      ) {
        return undefined;
      }
      return weaponToDisplay;
  }, [activeCharacterBase, activeCharacterSessionData, currentNexusArsenal, characterDefaultMeleeWeaponForNexus]);

  const effectiveNexusRangedWeapon = useMemo(() => {
      if (!activeCharacterBase || !activeCharacterSessionData) return undefined;
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
        weaponToDisplay.attack = Math.max(0, (weaponToDisplay.attack || 0) + activeCharacterSessionData.sessionRangedAttackModifier);
        weaponToDisplay.range = Math.max(0, (weaponToDisplay.range || 0) + activeCharacterSessionData.sessionRangedRangeModifier);
      }

      const template = charactersData.find(c => c.id === (activeCharacterBase.templateId || activeCharacterBase.id));
      if (weaponToDisplay?.name === "None" && weaponToDisplay.attack === (0 + activeCharacterSessionData.sessionRangedAttackModifier) && weaponToDisplay.range === (0 + activeCharacterSessionData.sessionRangedRangeModifier) && 
          !template?.rangedWeapon?.name &&
          !currentNexusArsenal?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 1)) &&
          !currentNexusArsenal?.rangedAttackMod && !currentNexusArsenal?.rangedRangeMod &&
          activeCharacterBase.templateId !== 'custom'
      ) {
        return undefined;
      }
      return weaponToDisplay;
  }, [activeCharacterBase, activeCharacterSessionData, currentNexusArsenal, characterDefaultRangedWeaponForNexus]);

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
    if (!activeCharacterId || !activeCharacterBase) {
        if (activeCharacterId && teamSessionData[activeCharacterId]) { 
            const charSession = teamSessionData[activeCharacterId]!; 
            if (Object.keys(charSession.abilityCooldowns || {}).length > 0 || Object.keys(charSession.abilityQuantities || {}).length > 0) {
                setTeamSessionData(prev => ({ 
                    ...prev,
                    [activeCharacterId]: {
                        ...(prev[activeCharacterId] || {}),
                        abilityCooldowns: {},
                        abilityQuantities: {},
                    } as TeamMemberSessionSpecificData, 
                }));
            }
        }
        return;
    }

    const allModalAbilities = [...effectiveNexusCharacterAbilities.baseAbilities, ...effectiveNexusCharacterAbilities.arsenalAbilities]
                              .sort((a, b) => a.id.localeCompare(b.id)); 
    
    const newCalculatedCDs: Record<string, number> = {};
    const newCalculatedQTs: Record<string, number> = {};

    const currentSessionForChar = teamSessionData[activeCharacterId]; 
    const stateCDs = currentSessionForChar?.abilityCooldowns || {};
    const stateQTs = currentSessionForChar?.abilityQuantities || {};

    allModalAbilities.forEach(ability => {
        if (ability.cooldown) {
            const maxRounds = parseCooldownRounds(String(ability.cooldown));
            if (maxRounds !== undefined) {
                newCalculatedCDs[ability.id] = stateCDs[ability.id] !== undefined ? stateCDs[ability.id] : maxRounds;
            }
        }
        if (ability.maxQuantity !== undefined) {
            newCalculatedQTs[ability.id] = stateQTs[ability.id] !== undefined ? stateQTs[ability.id] : ability.maxQuantity;
        }
    });
    
    if (
        JSON.stringify(stateCDs) !== JSON.stringify(newCalculatedCDs) ||
        JSON.stringify(stateQTs) !== JSON.stringify(newCalculatedQTs)
    ) {
        setTeamSessionData(prev => { 
            const charPrevSession = prev[activeCharacterId!] || {};
            const updatedCharSessionData = {
                ...charPrevSession,
                abilityCooldowns: newCalculatedCDs,
                abilityQuantities: newCalculatedQTs,
            };
            if (JSON.stringify(prev[activeCharacterId!]) !== JSON.stringify(updatedCharSessionData)) {
                return {
                    ...prev,
                    [activeCharacterId!]: updatedCharSessionData as TeamMemberSessionSpecificData, 
                };
            }
            return prev;
        });
    }
}, [
    activeCharacterId, 
    abilityDataStringForEffect, 
    activeCharacterBase, 
    effectiveNexusCharacterAbilities, 
    teamSessionData, 
]);

  const openAvatarImageModal = (character: Character) => {
    if (!character.imageUrl) return;
    setEnlargedModalContent({
      type: 'avatar',
      frontUrl: character.imageUrl,
      backUrl: character.backImageUrl,
      currentDisplayUrl: character.imageUrl,
      altText: character.name,
    });
    setImageZoomLevel(1);
  };


  const openArsenalImageModal = (card: ActualArsenalCard | null, side: 'front' | 'back') => {
    if (!card || (!card.imageUrlFront && !card.imageUrlBack)) {
        if (card) { 
            toast({ title: "No Images", description: `Arsenal card "${card.name}" has no front or back image URL.`, variant: "destructive" });
        }
        return;
    }
    
    const front = card.imageUrlFront || card.imageUrlBack || '';
    const back = card.imageUrlBack || card.imageUrlFront || '';
    
    if (!front && !back) { 
        toast({ title: "Missing Images", description: `Arsenal card "${card.name}" effectively has no images to display.`, variant: "destructive" });
        return;
    }

    setEnlargedModalContent({
      type: 'arsenal',
      frontUrl: front,
      backUrl: back,
      currentDisplayUrl: side === 'front' ? front : (back || front),
      altText: card.name,
    });
    setImageZoomLevel(1);
  };

  const handleImageDoubleClick = () => setImageZoomLevel(prev => prev > 1 ? 1 : ZOOM_SCALE_FACTOR);

  const handleModalImageInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); 

    if (enlargedModalContent && 
        imageZoomLevel === 1 && 
        enlargedModalContent.frontUrl && 
        enlargedModalContent.backUrl && 
        enlargedModalContent.frontUrl !== enlargedModalContent.backUrl) {
      setEnlargedModalContent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentDisplayUrl: prev.currentDisplayUrl === prev.frontUrl ? prev.backUrl! : prev.frontUrl,
        };
      });
      return; 
    }

    if (imageZoomLevel > 1) {
      setImageZoomLevel(1);
      return; 
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { setTouchEndX(null); setTouchEndY(null); setTouchStartX(e.targetTouches[0].clientX); setTouchStartY(e.targetTouches[0].clientY); };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { setTouchEndX(e.targetTouches[0].clientX); setTouchEndY(e.targetTouches[0].clientY); };
  
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY || !enlargedModalContent) { 
      setTouchStartX(null); setTouchEndX(null); setTouchStartY(null); setTouchEndY(null); 
      return; 
    }
    const deltaX = touchEndX - touchStartX; 
    const deltaY = touchEndY - touchStartY;

    if (enlargedModalContent.frontUrl && enlargedModalContent.backUrl && enlargedModalContent.frontUrl !== enlargedModalContent.backUrl) {
      if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE * 0.8) { // Horizontal Swipe
        setEnlargedModalContent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            currentDisplayUrl: prev.currentDisplayUrl === prev.frontUrl ? prev.backUrl! : prev.frontUrl,
          };
        });
        setImageZoomLevel(1);
      } else if (Math.abs(deltaX) < MAX_TAP_MOVEMENT && Math.abs(deltaY) < MAX_TAP_MOVEMENT) { 
        if (imageZoomLevel > 1) {
          setImageZoomLevel(1);
        }
      }
    } else { 
      if (Math.abs(deltaX) < MAX_TAP_MOVEMENT && Math.abs(deltaY) < MAX_TAP_MOVEMENT) { 
        if (imageZoomLevel > 1) {
          setImageZoomLevel(1);
        } else {
          setEnlargedModalContent(null);
        }
      }
    }
    setTouchStartX(null); setTouchEndX(null); setTouchStartY(null); setTouchEndY(null);
  };

  const handleAddCharacterToTeam = (characterToAdd: Character) => { 
    if (teamMembers.length >= MAX_TEAM_SIZE) { 
      toast({ title: "Team Full", description: `Maximum of ${MAX_TEAM_SIZE} characters allowed.`, variant: "destructive"}); 
      return;
    }
    if (teamMembers.find(p => p.id === characterToAdd.id)) { 
      toast({ title: "Already in Team", description: `${characterToAdd.name} is already in the team.`, variant: "destructive"}); 
      return;
    }

    const newTeamMemberBase = JSON.parse(JSON.stringify(characterToAdd)); 
    setTeamMembers(prev => [...prev, newTeamMemberBase]); 

    const defaultSessionData: TeamMemberSessionSpecificData = { 
      selectedArsenalId: newTeamMemberBase.selectedArsenalCardId || null,
      currentHp: newTeamMemberBase.baseStats.maxHp,
      currentSanity: newTeamMemberBase.baseStats.maxSanity,
      currentMv: newTeamMemberBase.baseStats.mv,
      currentDef: newTeamMemberBase.baseStats.def,
      sessionBleedPoints: newTeamMemberBase.bleedPoints || 0,
      sessionMaxHpModifier: 0,
      sessionMaxSanityModifier: 0,
      sessionMvModifier: 0,
      sessionDefModifier: 0,
      sessionMeleeAttackModifier: 0,
      sessionRangedAttackModifier: 0,
      sessionRangedRangeModifier: 0,
      abilityCooldowns: {},
      abilityQuantities: {},
    };
    
    const charAbilities = newTeamMemberBase.abilities || [];
    const arsenalForNewChar = arsenalCards.find(ac => ac.id === defaultSessionData.selectedArsenalId);
    const combinedAbilitiesForNewChar: CharacterAbility[] = [...charAbilities];

    if (arsenalForNewChar && arsenalForNewChar.items) {
        arsenalForNewChar.items.forEach(item => {
            const createAbility = (type: AbilityType, flag: boolean | undefined) => {
                if (flag === true) {
                    combinedAbilitiesForNewChar.push({
                        id: `nexus-arsenal-${arsenalForNewChar.id}-${item.id}-${type.replace(/\s+/g, '')}-init`,
                        name: item.abilityName || `Arsenal ${type}`, type,
                        description: item.itemDescription || item.effect || "",
                        cooldown: item.cd, maxQuantity: item.qty, cost: 0,
                    });
                }
            };
            createAbility('Action', item.isAction);
            createAbility('Interrupt', item.isInterrupt);
            createAbility('Passive', item.isPassive);
            createAbility('FREE Action', item.isFreeAction);
        });
    }
    
    combinedAbilitiesForNewChar.forEach(ab => {
        if(ab.cooldown) {
            const maxCd = parseCooldownRounds(ab.cooldown);
            if(maxCd !== undefined) defaultSessionData.abilityCooldowns[ab.id] = maxCd;
        }
        if(ab.maxQuantity !== undefined) defaultSessionData.abilityQuantities[ab.id] = ab.maxQuantity;
    });


    setTeamSessionData(prev => ({ ...prev, [newTeamMemberBase.id]: defaultSessionData })); 

    if (!activeCharacterId) {
      setActiveCharacterId(newTeamMemberBase.id);
    }
    toast({ title: "Character Added", description: `${newTeamMemberBase.name} joined the Nexus team.` }); 
  };

  const handleRemoveCharacterFromTeam = (characterIdToRemove: string) => { 
    const charToRemove = teamMembers.find(p => p.id === characterIdToRemove); 
    setTeamMembers(prev => prev.filter(p => p.id !== characterIdToRemove)); 
    setTeamSessionData(prev => { 
      const { [characterIdToRemove]: _, ...rest } = prev;
      return rest;
    });
    if (activeCharacterId === characterIdToRemove) {
      setActiveCharacterId(teamMembers.length > 1 ? teamMembers.find(p=> p.id !== characterIdToRemove)?.id || null : null); 
    }
    toast({ title: "Character Removed", description: `${charToRemove?.name || 'Character'} left the Nexus team.`, variant: "destructive" }); 
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

  const handleNexusTeamMemberStatChange = (characterId: string, stat: StatName, operation: 'increment' | 'decrement') => { 
    const memberSessionData = teamSessionData[characterId]; 
    const memberBase = teamMembers.find(p => p.id === characterId); 
    const memberEffectiveStats = calculateEffectiveStatsForMember(characterId);

    if (!memberSessionData || !memberBase || !memberEffectiveStats) return;
    const delta = operation === 'increment' ? 1 : -1;
    
    let currentValToChange = 0;
    if (stat === 'hp') currentValToChange = memberSessionData.currentHp;
    else if (stat === 'sanity') currentValToChange = memberSessionData.currentSanity;
    else return;

    let newValue = currentValToChange + delta; 
    newValue = Math.max(0, newValue); 
    
    let effectiveMax = 0;
    if (stat === 'hp') effectiveMax = memberEffectiveStats.maxHp;
    else if (stat === 'sanity') effectiveMax = memberEffectiveStats.maxSanity;
    
    effectiveMax = Math.max(1, effectiveMax);
    newValue = Math.min(newValue, effectiveMax);

    setTeamSessionData(prev => ({ 
        ...prev,
        [characterId]: {
            ...prev[characterId]!,
            [stat === 'hp' ? 'currentHp' : 'currentSanity']: newValue,
        }
    }));
  };

  const handleNexusTeamMemberBleedChange = (characterId: string, operation: 'increment' | 'decrement') => { 
    const memberSessionData = teamSessionData[characterId]; 
    if (!memberSessionData) return;
    const delta = operation === 'increment' ? 1 : -1;
    setTeamSessionData(prev => ({ 
        ...prev,
        [characterId]: {
            ...prev[characterId]!,
            sessionBleedPoints: Math.max(0, (prev[characterId]?.sessionBleedPoints || 0) + delta),
        }
    }));
  };
  
  const handleNexusModalStatChange = (stat: StatName, operation: 'increment' | 'decrement') => {
    if (!activeCharacterId || !activeCharacterSessionData || !activeCharacterBase || !effectiveNexusCharacterStats) return;
    const delta = operation === 'increment' ? 1 : -1;
    
    let currentValToChange: number;
    let statKeyInSessionData: keyof TeamMemberSessionSpecificData; 

    switch(stat) {
        case 'hp': currentValToChange = activeCharacterSessionData.currentHp; statKeyInSessionData = 'currentHp'; break;
        case 'sanity': currentValToChange = activeCharacterSessionData.currentSanity; statKeyInSessionData = 'currentSanity'; break;
        case 'mv': currentValToChange = activeCharacterSessionData.currentMv; statKeyInSessionData = 'currentMv'; break;
        case 'def': currentValToChange = activeCharacterSessionData.currentDef; statKeyInSessionData = 'currentDef'; break;
        default: return;
    }

    let newValue = currentValToChange + delta; 
    newValue = Math.max(0, newValue); 
    
    let effectiveMax: number;
    switch(stat) {
        case 'hp': effectiveMax = effectiveNexusCharacterStats.maxHp; break;
        case 'sanity': effectiveMax = effectiveNexusCharacterStats.maxSanity; break;
        case 'mv': effectiveMax = effectiveNexusCharacterStats.mv; break;
        case 'def': effectiveMax = effectiveNexusCharacterStats.def; break;
        default: return; 
    }
    
    effectiveMax = Math.max((stat === 'hp' || stat === 'sanity' ? 1 : 0), effectiveMax);
    newValue = Math.min(newValue, effectiveMax);

    setTeamSessionData(prev => ({ 
        ...prev,
        [activeCharacterId]: {
            ...prev[activeCharacterId]!,
            [statKeyInSessionData]: newValue,
        }
    }));
  };


  const handleNexusBleedPointsChange = (operation: 'increment' | 'decrement') => {
    if (!activeCharacterId || !activeCharacterSessionData) return;
    const delta = operation === 'increment' ? 1 : -1;
    setTeamSessionData(prev => ({ 
        ...prev,
        [activeCharacterId]: {
            ...prev[activeCharacterId]!,
            sessionBleedPoints: Math.max(0, (prev[activeCharacterId]?.sessionBleedPoints || 0) + delta),
        }
    }));
  };

  const handleSessionCryptoChange = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;
    setSessionCrypto(Math.max(0, numericValue));
  };

  const handleNexusSessionMaxStatModifierChange = (statType: 'hp' | 'sanity' | 'mv' | 'def', delta: number) => {
    if (!activeCharacterId || !activeCharacterSessionData || !activeCharacterBase || !effectiveNexusCharacterStats) return;

    const statKeyForModifier: keyof TeamMemberSessionSpecificData = 
        statType === 'hp' ? 'sessionMaxHpModifier' :
        statType === 'sanity' ? 'sessionMaxSanityModifier' :
        statType === 'mv' ? 'sessionMvModifier' : 'sessionDefModifier';
    
    const baseMaxValue = activeCharacterBase.baseStats[statType] || (statType === 'hp' || statType === 'sanity' ? 1 : 0);
    const currentStatToCapKey: keyof TeamMemberSessionSpecificData = 
        statType === 'hp' ? 'currentHp' : 
        statType === 'sanity' ? 'currentSanity' : 
        statType === 'mv' ? 'currentMv' : 'currentDef';


    setTeamSessionData(prev => { 
        const currentCharacterData = prev[activeCharacterId]!;
        const currentModifier = currentCharacterData[statKeyForModifier] as number;
        let newModifier = currentModifier + delta;

        const minEffectiveMax = statType === 'hp' || statType === 'sanity' ? 1 : 0;
        if (baseMaxValue + newModifier < minEffectiveMax) {
            newModifier = minEffectiveMax - baseMaxValue;
        }
        
        const updatedCharacterData = { ...currentCharacterData, [statKeyForModifier]: newModifier };
        
        const currentStatValue = updatedCharacterData[currentStatToCapKey] as number;

        let maxStatFromEffective = 0;
        if (statType === 'hp') maxStatFromEffective = effectiveNexusCharacterStats.maxHp - currentModifier + newModifier;
        else if (statType === 'sanity') maxStatFromEffective = effectiveNexusCharacterStats.maxSanity - currentModifier + newModifier;
        else if (statType === 'mv') maxStatFromEffective = effectiveNexusCharacterStats.mv - currentModifier + newModifier;
        else if (statType === 'def') maxStatFromEffective = effectiveNexusCharacterStats.def - currentModifier + newModifier;

        const finalEffectiveMaxForCapping = Math.max(minEffectiveMax, maxStatFromEffective);
        
        if (currentStatValue > finalEffectiveMaxForCapping) {
            updatedCharacterData[currentStatToCapKey] = finalEffectiveMaxForCapping;
        }


        return { ...prev, [activeCharacterId]: updatedCharacterData };
    });
  };

  const handleNexusSessionWeaponStatModifierChange = (
    weaponType: 'melee' | 'ranged',
    statTypeToModify: 'attack' | 'range',
    delta: number
  ) => {
    if (!activeCharacterId || !activeCharacterSessionData) return;

    const modifierKey: keyof TeamMemberSessionSpecificData = 
        weaponType === 'melee' ? 'sessionMeleeAttackModifier' :
        statTypeToModify === 'attack' ? 'sessionRangedAttackModifier' : 'sessionRangedRangeModifier';
    
    const baseWeapon = weaponType === 'melee' ? effectiveNexusMeleeWeapon : effectiveNexusRangedWeapon;
    const baseStatValue = baseWeapon ? (statTypeToModify === 'attack' ? baseWeapon.attack : (baseWeapon as RangedWeapon).range || 0) : 0;

    setTeamSessionData(prev => { 
        const currentCharacterData = prev[activeCharacterId]!;
        const currentModifier = currentCharacterData[modifierKey] as number;
        let newModifier = currentModifier + delta;

        const currentEffectiveStat = baseStatValue; 
        const newEffectiveStat = currentEffectiveStat - currentModifier + newModifier;

        if (newEffectiveStat < 0) { 
            newModifier = currentModifier - (currentEffectiveStat - currentModifier); 
        }
        return { ...prev, [activeCharacterId]: { ...currentCharacterData, [modifierKey]: newModifier } };
    });
  };


  const handleIncrementNexusCooldown = (abilityId: string) => {
    if (!activeCharacterId || !activeCharacterSessionData) return;
    const maxCD = (effectiveNexusCharacterAbilities.baseAbilities.find(a=>a.id === abilityId) || effectiveNexusCharacterAbilities.arsenalAbilities.find(a=>a.id === abilityId))?.cooldown;
    const maxCooldownValue = maxCD ? parseCooldownRounds(maxCD) : Infinity;

    setTeamSessionData(prev => ({ 
      ...prev,
      [activeCharacterId]: {
        ...prev[activeCharacterId]!,
        abilityCooldowns: {
          ...prev[activeCharacterId]?.abilityCooldowns,
          [abilityId]: Math.min((prev[activeCharacterId]?.abilityCooldowns[abilityId] || 0) + 1, maxCooldownValue || Infinity),
        }
      }
    }));
  };
  const handleDecrementNexusCooldown = (abilityId: string) => {
    if (!activeCharacterId || !activeCharacterSessionData) return;
    setTeamSessionData(prev => ({ 
      ...prev,
      [activeCharacterId]: {
        ...prev[activeCharacterId]!,
        abilityCooldowns: {
          ...prev[activeCharacterId]?.abilityCooldowns,
          [abilityId]: Math.max((prev[activeCharacterId]?.abilityCooldowns[abilityId] || 0) - 1, 0),
        }
      }
    }));
  };
  const handleIncrementNexusQuantity = (abilityId: string) => {
     if (!activeCharacterId || !activeCharacterSessionData) return;
    const maxQTY = (effectiveNexusCharacterAbilities.baseAbilities.find(a=>a.id === abilityId) || effectiveNexusCharacterAbilities.arsenalAbilities.find(a=>a.id === abilityId))?.maxQuantity;

    setTeamSessionData(prev => ({ 
      ...prev,
      [activeCharacterId]: {
        ...prev[activeCharacterId]!,
        abilityQuantities: {
          ...prev[activeCharacterId]?.abilityQuantities,
          [abilityId]: Math.min((prev[activeCharacterId]?.abilityQuantities[abilityId] || 0) + 1, maxQTY || Infinity),
        }
      }
    }));
  };
  const handleDecrementNexusQuantity = (abilityId: string) => {
    if (!activeCharacterId || !activeCharacterSessionData) return;
    setTeamSessionData(prev => ({ 
      ...prev,
      [activeCharacterId]: {
        ...prev[activeCharacterId]!,
        abilityQuantities: {
          ...prev[activeCharacterId]?.abilityQuantities,
          [abilityId]: Math.max((prev[activeCharacterId]?.abilityQuantities[abilityId] || 0) - 1, 0),
        }
      }
    }));
  };


  const getStatProgressColorClass = (current: number | null, max: number | undefined, statType?: 'hp' | 'sanity' | 'mv' | 'def'): string => {
    if (current === null || max === undefined || max === 0) return '[&>div]:bg-gray-400';
    const percentage = (current / max) * 100;
    if (statType === 'sanity') { if (percentage > 66) return "[&>div]:bg-blue-500"; if (percentage > 33) return "[&>div]:bg-blue-400"; return "[&>div]:bg-red-500"; }
    if (statType === 'def' || statType === 'mv') { if (percentage >= 75) return "[&>div]:bg-green-500"; if (percentage >= 40) return "[&>div]:bg-yellow-500"; return "[&>div]:bg-red-500"; }
    if (percentage <= 33) return '[&>div]:bg-red-500'; if (percentage <= 66) return '[&>div]:bg-yellow-500'; return '[&>div]:bg-green-500';
  };

  const getSkillIcon = (skillId: SkillName): React.ElementType => { const skillDef = skillDefinitions.find(s => s.id === skillId); return skillDef?.icon || Library; };

  const handleInitiateSaveNexusState = () => {
    if (!currentUser) { toast({ title: "Login Required", description: "You must be logged in to save a Nexus session.", variant: "destructive" }); return; }
    if (teamMembers.length === 0) { toast({ title: "No Team Members", description: "Add at least one character to the team before saving.", variant: "destructive" }); return; } 
    setSaveNexusName(`Nexus Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    setIsSaveNexusDialogOpen(true);
  };

  const executeSaveNexusState = async () => {
    if (!currentUser || teamMembers.length === 0 || !auth.currentUser ) { 
      toast({ title: "Error", description: "Missing data to save Nexus session.", variant: "destructive" });
      return;
    }
    if (!saveNexusName.trim()) { toast({ title: "Save Name Required", description: "Please enter a name for your saved session.", variant: "destructive" }); return; }

    setIsSavingNexus(true);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const partyToSave: PartyMemberSavedState[] = teamMembers.map(member => { 
      const sessionDataForMember = teamSessionData[member.id]; 
      if (!sessionDataForMember) {
        console.error(`Missing session data for team member ${member.id} during save.`); 
        const baseChar = charactersData.find(c => c.id === member.id) || charactersData.find(c=> c.id === 'custom')!;
        return { 
          baseCharacterId: member.id,
          characterName: member.name,
          characterImageUrl: member.imageUrl,
          selectedArsenalId: null,
          currentHp: baseChar.baseStats.maxHp, currentSanity: baseChar.baseStats.maxSanity, currentMv: baseChar.baseStats.mv, currentDef: baseChar.baseStats.def,
          sessionBleedPoints: 0, sessionMaxHpModifier: 0, sessionMaxSanityModifier: 0, sessionMvModifier: 0, sessionDefModifier: 0,
          sessionMeleeAttackModifier: 0, sessionRangedAttackModifier: 0, sessionRangedRangeModifier: 0,
          abilityCooldowns: {}, abilityQuantities: {},
        };
      }
      return {
        baseCharacterId: member.id,
        characterName: member.name, 
        characterImageUrl: member.imageUrl, 
        selectedArsenalId: sessionDataForMember.selectedArsenalId,
        currentHp: sessionDataForMember.currentHp, currentSanity: sessionDataForMember.currentSanity,
        currentMv: sessionDataForMember.currentMv, currentDef: sessionDataForMember.currentDef,
        sessionBleedPoints: sessionDataForMember.sessionBleedPoints,
        sessionMaxHpModifier: sessionDataForMember.sessionMaxHpModifier, sessionMaxSanityModifier: sessionDataForMember.sessionMaxSanityModifier,
        sessionMvModifier: sessionDataForMember.sessionMvModifier, sessionDefModifier: sessionDataForMember.sessionDefModifier,
        sessionMeleeAttackModifier: sessionDataForMember.sessionMeleeAttackModifier,
        sessionRangedAttackModifier: sessionDataForMember.sessionRangedAttackModifier, sessionRangedRangeModifier: sessionDataForMember.sessionRangedRangeModifier,
        abilityCooldowns: sessionDataForMember.abilityCooldowns, abilityQuantities: sessionDataForMember.abilityQuantities,
      };
    });

    const savedState: SavedNexusState = {
      id: sessionId,
      name: saveNexusName.trim(),
      userId: currentUser.uid,
      lastSaved: new Date().toISOString(),
      party: partyToSave, 
      activeCharacterIdInSession: activeCharacterId,
      sessionCrypto: sessionCrypto,
    };

    try {
      const nexusStatesCollectionRef = collection(db, "userNexusStates", currentUser.uid, "states");
      await setDoc(doc(nexusStatesCollectionRef, savedState.id), savedState);
      toast({ title: "Nexus Session Saved!", description: `Session "${savedState.name}" has been saved.` });
      setIsSaveNexusDialogOpen(false); setSaveNexusName("");
    } catch (error) {
      console.error("Error saving Nexus session:", error);
      toast({ title: "Save Failed", description: "Could not save Nexus session. Please try again.", variant: "destructive" });
    } finally { setIsSavingNexus(false); }
  };

  const executeResetNexusSession = () => {
    setTeamMembers([]); 
    setActiveCharacterId(null);
    setTeamSessionData({}); 
    setSessionCrypto(0);
    setNexusLatestRoll(null);
    setNexusDrawnCardsHistory([]);
    setNexusSelectedDeckName(undefined);
    setIsResetDialogOpen(false);
    setIsCryptoVisible(true);
    setIsDiceRollerVisible(true);
    setIsCardDecksVisible(true);
    setIsCoreStatsVisible(true); 
    setIsNexusMvVisible(true);
    setIsNexusDefVisible(true);
    setIsNexusBleedVisible(true);
    setIsNexusMeleeAttackVisible(false);
    setIsNexusRangedAttackVisible(false);
    toast({ title: "Nexus Session Reset", description: "The current session has been cleared." });
  };

  const handleOpenLoadSessionDialog = async () => {
    if (!currentUser || !auth.currentUser) { toast({ title: "Login Required", description: "You must be logged in to load saved sessions.", variant: "destructive" }); return; }
    setIsLoadNexusDialogOpen(true); setIsLoadingSessions(true);
    try {
      const sessionsCollectionRef = collection(db, "userNexusStates", auth.currentUser.uid, "states");
      const querySnapshot = await getDocs(sessionsCollectionRef);
      const sessions = querySnapshot.docs.map(docSnap => docSnap.data() as SavedNexusState)
        .sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()); 
      setSavedNexusSessions(sessions);
    } catch (error) {
      console.error("Error fetching saved Nexus sessions:", error);
      toast({ title: "Load Error", description: "Could not fetch saved sessions.", variant: "destructive" });
      setSavedNexusSessions([]);
    } finally { setIsLoadingSessions(false); }
  };

  const handleLoadSelectedSession = (session: SavedNexusState) => {
    const loadedTeamMembers: Character[] = []; 
    const loadedTeamSessionData: Record<string, TeamMemberSessionSpecificData> = {}; 

    session.party.forEach(savedMember => { 
      const baseCharTemplate = charactersData.find(c => c.id === savedMember.baseCharacterId);
      if (baseCharTemplate) {
        const charInstance: Character = {
            ...JSON.parse(JSON.stringify(baseCharTemplate)),
            id: savedMember.baseCharacterId, 
            name: savedMember.characterName || baseCharTemplate.name, 
            imageUrl: savedMember.characterImageUrl || baseCharTemplate.imageUrl, 
            backImageUrl: baseCharTemplate.backImageUrl, 
        };
        loadedTeamMembers.push(charInstance); 
        
        loadedTeamSessionData[savedMember.baseCharacterId] = { 
          selectedArsenalId: savedMember.selectedArsenalId,
          currentHp: savedMember.currentHp, currentSanity: savedMember.currentSanity,
          currentMv: savedMember.currentMv, currentDef: savedMember.currentDef,
          sessionBleedPoints: savedMember.sessionBleedPoints,
          sessionMaxHpModifier: savedMember.sessionMaxHpModifier, sessionMaxSanityModifier: savedMember.sessionMaxSanityModifier,
          sessionMvModifier: savedMember.sessionMvModifier, sessionDefModifier: savedMember.sessionDefModifier,
          sessionMeleeAttackModifier: savedMember.sessionMeleeAttackModifier,
          sessionRangedAttackModifier: savedMember.sessionRangedAttackModifier, sessionRangedRangeModifier: savedMember.sessionRangedRangeModifier,
          abilityCooldowns: savedMember.abilityCooldowns || {}, abilityQuantities: savedMember.abilityQuantities || {},
        };
      } else {
        console.warn(`Base character template for ID ${savedMember.baseCharacterId} not found during load. Skipping member.`);
      }
    });

    setTeamMembers(loadedTeamMembers); 
    setTeamSessionData(loadedTeamSessionData); 
    setActiveCharacterId(session.activeCharacterIdInSession);
    setSessionCrypto(session.sessionCrypto);
    
    setNexusLatestRoll(null);
    setNexusDrawnCardsHistory([]);
    setNexusSelectedDeckName(undefined);
    setIsCryptoVisible(true); 
    setIsDiceRollerVisible(true);
    setIsCardDecksVisible(true);
    setIsCoreStatsVisible(true); 
    setIsNexusMvVisible(true);
    setIsNexusDefVisible(true);
    setIsNexusBleedVisible(true);
    setIsNexusMeleeAttackVisible(false);
    setIsNexusRangedAttackVisible(false);

    setIsLoadNexusDialogOpen(false);
    toast({ title: "Session Loaded", description: `Session "${session.name}" has been loaded.` });
  };

  const confirmDeleteSession = (session: SavedNexusState) => { setSessionToDelete(session); };

  const executeDeleteSession = async () => {
    if (!sessionToDelete || !currentUser || !auth.currentUser) return;
    setIsDeletingSession(true);
    try {
      const sessionDocRef = doc(db, "userNexusStates", auth.currentUser.uid, "states", sessionToDelete.id);
      await deleteDoc(sessionDocRef);
      toast({ title: "Session Deleted", description: `Session "${sessionToDelete.name}" has been deleted.` });
      setSavedNexusSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (error) {
      console.error("Error deleting Nexus session:", error);
      toast({ title: "Delete Failed", description: "Could not delete session.", variant: "destructive" });
    } finally { setIsDeletingSession(false); }
  };
  
  const currentModalImageSrc = enlargedModalContent?.currentDisplayUrl;


  return (
    <>
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
            <div className="flex items-center gap-1">
               <Button variant="outline" size="sm" onClick={() => setIsCharacterManagementDialogOpen(true)} disabled={isSavingNexus || isLoadingSessions || isDeletingSession}>
                  <Users2 className="mr-1.5 h-4 w-4" /> Manage Team
                </Button>
              {currentUser && teamMembers.length > 0 && ( 
                <Button variant="outline" size="sm" onClick={handleInitiateSaveNexusState} disabled={isSavingNexus}>
                  <Save className="mr-1.5 h-4 w-4" /> Save Session
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Session Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem onSelect={handleOpenLoadSessionDialog} disabled={!currentUser}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Load Session
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Eye className="mr-2 h-4 w-4" />
                      Display Preferences
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuCheckboxItem
                          checked={isCoreStatsVisible}
                          onCheckedChange={setIsCoreStatsVisible}
                        >
                          Show Active Character Stats
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={isCryptoVisible}
                          onCheckedChange={setIsCryptoVisible}
                        >
                          Show Crypto Tracker
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={isDiceRollerVisible}
                          onCheckedChange={setIsDiceRollerVisible}
                        >
                          Show Dice Roller
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={isCardDecksVisible}
                          onCheckedChange={setIsCardDecksVisible}
                        >
                          Show Card Decks
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Compact Card Stats</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem checked={isNexusMvVisible} onCheckedChange={setIsNexusMvVisible}>Show MV</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={isNexusDefVisible} onCheckedChange={setIsNexusDefVisible}>Show DEF</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={isNexusBleedVisible} onCheckedChange={setIsNexusBleedVisible}>Show Bleed</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={isNexusMeleeAttackVisible} onCheckedChange={setIsNexusMeleeAttackVisible}>Show Melee ATK</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={isNexusRangedAttackVisible} onCheckedChange={setIsNexusRangedAttackVisible}>Show Ranged ATK</DropdownMenuCheckboxItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsResetDialogOpen(true)} disabled={teamMembers.length === 0}> 
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <Dialog open={isCharacterManagementDialogOpen} onOpenChange={setIsCharacterManagementDialogOpen}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Manage Team</DialogTitle>
                  <DialogDescription>Add or remove characters from your Nexus team (Max {MAX_TEAM_SIZE}).</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Current Team ({teamMembers.length}/{MAX_TEAM_SIZE}):</h4> 
                        {teamMembers.length === 0 ? ( 
                            <p className="text-xs text-muted-foreground">No characters in team.</p> 
                        ) : (
                            <ScrollArea className="h-[150px] border rounded-md p-2">
                                <div className="space-y-1">
                                {teamMembers.map(member => ( 
                                    <div key={`manage-${member.id}`} className="flex items-center justify-between p-1.5 rounded bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7"><AvatarImage src={member.imageUrl} alt={member.name}/><AvatarFallback>{member.name.substring(0,1)}</AvatarFallback></Avatar>
                                            <span className="text-xs">{member.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveCharacterFromTeam(member.id)}><UserRoundX className="h-3.5 w-3.5"/></Button> 
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-2">Available Characters to Add:</h4>
                         <ScrollArea className="h-[200px] border rounded-md p-2">
                            <div className="space-y-1">
                            {charactersData.filter(char => !teamMembers.some(p => p.id === char.id)).map((char) => ( 
                            <Button key={`add-${char.id}`} variant="ghost" className="w-full justify-start p-1.5 h-auto text-xs" onClick={() => handleAddCharacterToTeam(char)} disabled={teamMembers.length >= MAX_TEAM_SIZE}> 
                                <Avatar className="h-7 w-7 mr-2">
                                <AvatarImage src={char.imageUrl || `https://placehold.co/40x40.png?text=${char.name.substring(0,1)}`} alt={char.name} data-ai-hint="character avatar"/>
                                <AvatarFallback>{char.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {char.name}
                            </Button>
                            ))}
                             {charactersData.filter(char => !teamMembers.some(p => p.id === char.id)).length === 0 && ( 
                                <p className="text-xs text-muted-foreground text-center py-2">All available characters are in the team.</p> 
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Done</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
          </Dialog>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        {isCryptoVisible && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center">
                                    <Coins className="mr-2 h-5 w-5 text-yellow-400" />Session Crypto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleSessionCryptoChange(sessionCrypto - 1)} className="h-8 w-8">
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={sessionCrypto}
                                        onChange={(e) => handleSessionCryptoChange(e.target.value)}
                                        className="w-24 h-8 text-center text-lg font-bold"
                                        min="0"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => handleSessionCryptoChange(sessionCrypto + 1)} className="h-8 w-8">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {isDiceRollerVisible && (
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
                        )}

                        {isCardDecksVisible && (
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
                                        <GameCardDisplay card={nexusDrawnCardsHistory[0]} key={`${nexusDrawnCardsHistory[0].id}-${nexusCardKey}`} size="medium" onClick={() => nexusDrawnCardsHistory[0].imageUrl && openAvatarImageModal(nexusDrawnCardsHistory[0] as unknown as Character)} isButton={!!nexusDrawnCardsHistory[0].imageUrl} className="mx-auto animate-in fade-in duration-300" imageOnly={true} />
                                    </div>
                                    )}
                                    {nexusDrawnCardsHistory.length > 1 && (
                                        <div className="mt-4">
                                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground text-center">Previously Drawn</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                        {nexusDrawnCardsHistory.slice(1).map((card, idx) => (
                                            <GameCardDisplay key={`${card.id}-hist-${idx}`} card={card} size="small" onClick={() => card.imageUrl && openAvatarImageModal(card as unknown as Character)} isButton={!!card.imageUrl} className="w-full" imageOnly={true} />
                                        ))}
                                        </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {teamMembers.length > 0 ? ( 
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {teamMembers.map((member, memberIndex) => { 
                                    const memberSessionData = teamSessionData[member.id]; 
                                    const memberEffectiveStats = calculateEffectiveStatsForMember(member.id);
                                    if (!memberSessionData || !memberEffectiveStats) return null;

                                    return (
                                        <Card key={member.id} className={cn("p-2 flex flex-col min-w-0", activeCharacterId === member.id && "border-2 border-primary ring-2 ring-primary shadow-lg")}>
                                            <CardHeader 
                                                className="p-1.5 pt-0 flex-row items-center justify-between gap-1 cursor-pointer" 
                                                onClick={() => setActiveCharacterId(member.id)}
                                            >
                                                <div className="flex items-center gap-1.5 flex-grow min-w-0">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.substring(0,1)}`} alt={member.name} data-ai-hint="character avatar small"/>
                                                        <AvatarFallback>{member.name.substring(0,1)}</AvatarFallback>
                                                    </Avatar>
                                                    <CardTitle className="text-sm font-semibold text-primary truncate flex-grow">{member.name}</CardTitle>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setActiveCharacterId(member.id); setIsCharacterCardModalOpen(true); }} aria-label={`View details for ${member.name}`}>
                                                  <Info className="h-3.5 w-3.5"/>
                                                </Button>
                                            </CardHeader>
                                            {member.imageUrl && (
                                              <button
                                                  type="button"
                                                  onClick={() => openAvatarImageModal(member)} 
                                                  className="relative w-full h-32 sm:h-36 rounded-md overflow-hidden border border-border mb-2 hover:ring-1 hover:ring-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                                  aria-label={`View image for ${member.name}`}
                                              >
                                                  <Image
                                                      src={member.imageUrl}
                                                      alt={member.name}
                                                      fill
                                                      style={{ objectFit: 'contain' }}
                                                      data-ai-hint={`${member.name} character art compact`}
                                                      priority={activeCharacterId === member.id || memberIndex < 2} 
                                                  />
                                              </button>
                                            )}
                                            <CardContent className="p-1 space-y-1.5 flex-grow mt-1">
                                                {/* HP */}
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="flex items-center text-xs font-medium"><Heart className="mr-1 h-3 w-3 text-red-500" />HP</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberStatChange(member.id, 'hp', 'decrement'); }} disabled={memberSessionData.currentHp === 0}><Minus className="h-2.5 w-2.5" /></Button> 
                                                            <Input type="number" readOnly value={memberSessionData.currentHp} className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberStatChange(member.id, 'hp', 'increment');}} disabled={memberSessionData.currentHp >= memberEffectiveStats.maxHp}><Plus className="h-2.5 w-2.5" /></Button> 
                                                        </div>
                                                    </div>
                                                    <Progress value={(memberSessionData.currentHp / Math.max(1, memberEffectiveStats.maxHp)) * 100} className={cn("h-1", getStatProgressColorClass(memberSessionData.currentHp, memberEffectiveStats.maxHp, 'hp'))} />
                                                    <p className="text-xs text-muted-foreground text-right">{memberSessionData.currentHp}/{memberEffectiveStats.maxHp}</p>
                                                </div>
                                                {/* Sanity */}
                                                 <div className="space-y-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="flex items-center text-xs font-medium"><Brain className="mr-1 h-3 w-3 text-blue-400" />Sanity</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberStatChange(member.id, 'sanity', 'decrement');}} disabled={memberSessionData.currentSanity === 0}><Minus className="h-2.5 w-2.5" /></Button> 
                                                            <Input type="number" readOnly value={memberSessionData.currentSanity} className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                                            <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberStatChange(member.id, 'sanity', 'increment');}} disabled={memberSessionData.currentSanity >= memberEffectiveStats.maxSanity}><Plus className="h-2.5 w-2.5" /></Button> 
                                                        </div>
                                                    </div>
                                                    <Progress value={(memberSessionData.currentSanity / Math.max(1, memberEffectiveStats.maxSanity)) * 100} className={cn("h-1", getStatProgressColorClass(memberSessionData.currentSanity, memberEffectiveStats.maxSanity, 'sanity'))} />
                                                    <p className="text-xs text-muted-foreground text-right">{memberSessionData.currentSanity}/{memberEffectiveStats.maxSanity}</p>
                                                </div>
                                                {/* Bleed */}
                                                {isNexusBleedVisible && (
                                                    <div className={cn("space-y-0.5", memberSessionData.sessionBleedPoints >= NEXUS_HEMORRHAGE_THRESHOLD ? "border-destructive ring-1 ring-destructive rounded p-0.5 -m-0.5" : "")}>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="flex items-center text-xs font-medium"><Droplets className="mr-1 h-3 w-3 text-red-400" />Bleed</Label>
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberBleedChange(member.id, 'decrement');}} disabled={memberSessionData.sessionBleedPoints === 0}><Minus className="h-2.5 w-2.5" /></Button> 
                                                                <Input type="number" readOnly value={memberSessionData.sessionBleedPoints} className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleNexusTeamMemberBleedChange(member.id, 'increment');}}><Plus className="h-2.5 w-2.5" /></Button> 
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground text-right">Hemorrhage at: {NEXUS_HEMORRHAGE_THRESHOLD}</p>
                                                        {memberSessionData.sessionBleedPoints >= NEXUS_HEMORRHAGE_THRESHOLD && (
                                                            <div className="text-xs text-destructive font-bold flex items-center justify-end"><AlertTriangle className="mr-1 h-3 w-3" /> HEMORRHAGE!</div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* MV */}
                                                {isNexusMvVisible && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <Label className="flex items-center font-medium"><Footprints className="mr-1 h-3 w-3 text-green-500" />MV</Label>
                                                        <span>{memberEffectiveStats.mv}</span>
                                                    </div>
                                                )}
                                                {/* DEF */}
                                                {isNexusDefVisible && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <Label className="flex items-center font-medium"><Shield className="mr-1 h-3 w-3 text-gray-400" />DEF</Label>
                                                        <span>{memberEffectiveStats.def}</span>
                                                    </div>
                                                )}
                                                {/* Melee Attack */}
                                                {isNexusMeleeAttackVisible && memberEffectiveStats.meleeAttack !== undefined && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <Label className="flex items-center font-medium"><MeleeIcon className="mr-1 h-3 w-3 text-orange-400" />Melee ATK</Label>
                                                        <span>{memberEffectiveStats.meleeAttack}</span>
                                                    </div>
                                                )}
                                                {/* Ranged Attack */}
                                                {isNexusRangedAttackVisible && memberEffectiveStats.rangedAttack !== undefined && memberEffectiveStats.rangedRange !== undefined && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <Label className="flex items-center font-medium"><Crosshair className="mr-1 h-3 w-3 text-cyan-400" />Ranged</Label>
                                                        <span>A{memberEffectiveStats.rangedAttack}/R{memberEffectiveStats.rangedRange}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                             <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] text-center p-6 bg-card rounded-lg shadow-md">
                                <UserCircle2 className="h-16 w-16 text-muted-foreground mb-3" />
                                <h2 className="text-lg font-semibold text-muted-foreground">No Team Members</h2>
                                <p className="text-sm text-muted-foreground">Click "Manage Team" in the header to add characters.</p>
                            </div>
                        )}
                        
                        {activeCharacterBase && activeCharacterSessionData && effectiveNexusCharacterStats && (
                            <Card className="mt-6">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center">
                                      <Package className="mr-2 h-5 w-5 text-accent" /> Arsenal for {activeCharacterBase.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {criticalArsenalError ? (
                                        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>{criticalArsenalError.name}</AlertTitle><AlertDescription>{criticalArsenalError.description} {criticalArsenalError.items?.[0]?.abilityName}</AlertDescription></Alert>
                                    ) : (
                                        <Select 
                                            value={activeCharacterSessionData.selectedArsenalId || "none"} 
                                            onValueChange={(value) => {
                                                if(activeCharacterId) {
                                                    setTeamSessionData(prev => ({...prev, [activeCharacterId]: {...prev[activeCharacterId]!, selectedArsenalId: value === "none" ? null : value}})); 
                                                }
                                            }} 
                                            disabled={!arsenalCards || arsenalCards.length === 0 || (arsenalCards.length === 1 && arsenalCards[0].id.startsWith('error-'))}
                                        >
                                            <SelectTrigger id="nexusArsenalSelectActive"><SelectValue placeholder="No Arsenal Equipped..." /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{arsenalCards.filter(card => !card.id.startsWith('error-')).map(card => (<SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                    )}
                                    {currentNexusArsenal && (
                                        <div className="mt-3 p-3 rounded-md border border-accent/50 bg-muted/20">
                                            <h4 className="text-sm font-semibold text-accent">{currentNexusArsenal.name}</h4>
                                            {currentNexusArsenal.description && <p className="text-xs text-muted-foreground mb-2">{currentNexusArsenal.description}</p>}
                                            {(currentNexusArsenal.imageUrlFront || currentNexusArsenal.imageUrlBack) && (
                                                <div className="mt-2 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-2">
                                                    {currentNexusArsenal.imageUrlFront && (
                                                    <button type="button" onClick={() => openArsenalImageModal(currentNexusArsenal, 'front')} className="relative w-full sm:w-1/2 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`View front of ${currentNexusArsenal.name} card`}>
                                                        <Image src={currentNexusArsenal.imageUrlFront} alt={`${currentNexusArsenal.name} - Front`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card front" />
                                                    </button>
                                                    )}
                                                    {currentNexusArsenal.imageUrlBack && (
                                                    <button type="button" onClick={() => openArsenalImageModal(currentNexusArsenal, 'back')} className="relative w-full sm:w-1/2 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`View back of ${currentNexusArsenal.name} card`}>
                                                        <Image src={currentNexusArsenal.imageUrlBack} alt={`${currentNexusArsenal.name} - Back`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card back" />
                                                    </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        {isCoreStatsVisible && activeCharacterBase && activeCharacterSessionData && effectiveNexusCharacterStats && (
                             <Card className="mt-6">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center">
                                        <UserCircle2 className="mr-2 h-5 w-5 text-primary" /> Active Character Stats: {activeCharacterBase.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                        {/* HP, Sanity, MV, DEF displays for ACTIVE character, using effectiveNexusCharacterStats and activeCharacterSessionData */}
                                        {/* HP */}
                                        <div className="space-y-0.5">
                                            <Label className="flex items-center text-sm font-medium"><Heart className="mr-1.5 h-4 w-4 text-red-500" />HP</Label>
                                            <Progress value={(activeCharacterSessionData.currentHp / Math.max(1, effectiveNexusCharacterStats.maxHp)) * 100} className={cn("h-2", getStatProgressColorClass(activeCharacterSessionData.currentHp, effectiveNexusCharacterStats.maxHp, 'hp'))} />
                                            <p className="text-xs text-muted-foreground text-right">{activeCharacterSessionData.currentHp} / {effectiveNexusCharacterStats.maxHp}</p>
                                        </div>
                                        {/* Sanity */}
                                        <div className="space-y-0.5">
                                            <Label className="flex items-center text-sm font-medium"><Brain className="mr-1.5 h-4 w-4 text-blue-400" />Sanity</Label>
                                            <Progress value={(activeCharacterSessionData.currentSanity / Math.max(1, effectiveNexusCharacterStats.maxSanity)) * 100} className={cn("h-2", getStatProgressColorClass(activeCharacterSessionData.currentSanity, effectiveNexusCharacterStats.maxSanity, 'sanity'))} />
                                            <p className="text-xs text-muted-foreground text-right">{activeCharacterSessionData.currentSanity} / {effectiveNexusCharacterStats.maxSanity}</p>
                                        </div>
                                        {/* MV */}
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center text-sm font-medium"><Footprints className="mr-1.5 h-4 w-4 text-green-500" />MV</Label>
                                            <Badge variant="outline" className="text-sm">{effectiveNexusCharacterStats.mv}</Badge>
                                        </div>
                                        {/* DEF */}
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center text-sm font-medium"><Shield className="mr-1.5 h-4 w-4 text-gray-400" />DEF</Label>
                                            <Badge variant="outline" className="text-sm">{effectiveNexusCharacterStats.def}</Badge>
                                        </div>
                                        {/* Bleed */}
                                        <div className={cn("flex items-center justify-between md:col-span-2", activeCharacterSessionData.sessionBleedPoints >= NEXUS_HEMORRHAGE_THRESHOLD ? "p-1 rounded-sm ring-1 ring-destructive" : "")}>
                                            <Label className="flex items-center text-sm font-medium"><Droplets className="mr-1.5 h-4 w-4 text-red-400" />Bleed Pts.</Label>
                                            <Badge variant={activeCharacterSessionData.sessionBleedPoints >= NEXUS_HEMORRHAGE_THRESHOLD ? "destructive" : "outline"} className="text-sm">
                                                {activeCharacterSessionData.sessionBleedPoints}
                                                {activeCharacterSessionData.sessionBleedPoints >= NEXUS_HEMORRHAGE_THRESHOLD && <AlertTriangle className="ml-1.5 h-3 w-3 inline"/>}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                             </Card>
                        )}
                    </div>
                </div>
            </main>

          <Dialog 
            open={isCharacterCardModalOpen} 
            onOpenChange={(open) => { setIsCharacterCardModalOpen(open); }}
          >
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
              {activeCharacterBase && activeCharacterSessionData && effectiveNexusCharacterStats && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-primary text-center">{activeCharacterBase.name}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] p-1">
                    <div className="space-y-4 p-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            type="button" 
                            onClick={() => activeCharacterBase.imageUrl && openAvatarImageModal(activeCharacterBase)} 
                            disabled={!activeCharacterBase.imageUrl}
                            className={cn("mx-auto block", activeCharacterBase.imageUrl ? "cursor-pointer" : "cursor-default")}
                            aria-label={activeCharacterBase.imageUrl ? "View full character card" : "Character image"}
                          >
                            <Avatar className="w-32 h-32 mx-auto mb-3 border-4 border-primary shadow-lg hover:ring-2 hover:ring-accent">
                              <AvatarImage src={activeCharacterBase.imageUrl || `https://placehold.co/128x128.png`} alt={activeCharacterBase.name} data-ai-hint="character avatar large"/>
                              <AvatarFallback className="text-4xl bg-muted">{activeCharacterBase.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </button>
                        </TooltipTrigger>
                        {activeCharacterBase.imageUrl && <TooltipContent><p>Click to view full card (front/back if available)</p></TooltipContent>}
                      </Tooltip>
                      
                      <Separator />
                      <h4 className="text-lg font-semibold text-primary flex items-center mt-1 mb-2"><Info className="mr-2 h-5 w-5" /> Core Stats &amp; Trackers</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Heart className="mr-1.5 h-3 w-3 text-red-500" />HP</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('hp', 'decrement')} disabled={activeCharacterSessionData.currentHp === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={activeCharacterSessionData.currentHp} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('hp', 'increment')} disabled={activeCharacterSessionData.currentHp >= effectiveNexusCharacterStats.maxHp}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(activeCharacterSessionData.currentHp / Math.max(1, effectiveNexusCharacterStats.maxHp)) * 100} className={cn("h-1", getStatProgressColorClass(activeCharacterSessionData.currentHp, effectiveNexusCharacterStats.maxHp, 'hp'))} />
                            <p className="text-xs text-muted-foreground text-right mt-1">{activeCharacterSessionData.currentHp} / {effectiveNexusCharacterStats.maxHp}</p>
                            <div className="flex items-center gap-1 mt-2.5">
                                <Label htmlFor="nexusModalMaxMod-hp" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('hp', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-hp" type="number" value={activeCharacterSessionData.sessionMaxHpModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('hp', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Brain className="mr-1.5 h-3 w-3 text-blue-400" />Sanity</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('sanity', 'decrement')} disabled={activeCharacterSessionData.currentSanity === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={activeCharacterSessionData.currentSanity} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('sanity', 'increment')} disabled={activeCharacterSessionData.currentSanity >= effectiveNexusCharacterStats.maxSanity}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                            <Progress value={(activeCharacterSessionData.currentSanity / Math.max(1, effectiveNexusCharacterStats.maxSanity)) * 100} className={cn("h-1", getStatProgressColorClass(activeCharacterSessionData.currentSanity, effectiveNexusCharacterStats.maxSanity, 'sanity'))} />
                            <p className="text-xs text-muted-foreground text-right mt-1">{activeCharacterSessionData.currentSanity} / {effectiveNexusCharacterStats.maxSanity}</p>
                             <div className="flex items-center gap-1 mt-2.5">
                                <Label htmlFor="nexusModalMaxMod-sanity" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('sanity', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-sanity" type="number" value={activeCharacterSessionData.sessionMaxSanityModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('sanity', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <Label className="flex items-center text-xs font-medium"><Footprints className="mr-1.5 h-3 w-3 text-green-500" />MV</Label>
                             <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('mv', 'decrement')} disabled={activeCharacterSessionData.currentMv === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={activeCharacterSessionData.currentMv} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('mv', 'increment')} disabled={activeCharacterSessionData.currentMv >= effectiveNexusCharacterStats.mv}><Plus className="h-2.5 w-2.5" /></Button>
                              </div>
                            </div>
                            <Progress value={(activeCharacterSessionData.currentMv / Math.max(0, effectiveNexusCharacterStats.mv)) * 100} className={cn("h-1", getStatProgressColorClass(activeCharacterSessionData.currentMv, effectiveNexusCharacterStats.mv, 'mv'))} />
                            <p className="text-xs text-muted-foreground text-right mt-1">{activeCharacterSessionData.currentMv} / {effectiveNexusCharacterStats.mv}</p>
                            <div className="flex items-center gap-1 mt-2.5">
                                <Label htmlFor="nexusModalMaxMod-mv" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('mv', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-mv" type="number" value={activeCharacterSessionData.sessionMvModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('mv', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <Label className="flex items-center text-xs font-medium"><Shield className="mr-1.5 h-3 w-3 text-gray-400" />DEF</Label>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('def', 'decrement')} disabled={activeCharacterSessionData.currentDef === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input type="number" readOnly value={activeCharacterSessionData.currentDef} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusModalStatChange('def', 'increment')} disabled={activeCharacterSessionData.currentDef >= effectiveNexusCharacterStats.def}><Plus className="h-2.5 w-2.5" /></Button>
                              </div>
                            </div>
                            <Progress value={(activeCharacterSessionData.currentDef / Math.max(0, effectiveNexusCharacterStats.def)) * 100} className={cn("h-1", getStatProgressColorClass(activeCharacterSessionData.currentDef, effectiveNexusCharacterStats.def, 'def'))} />
                            <p className="text-xs text-muted-foreground text-right mt-1">{activeCharacterSessionData.currentDef} / {effectiveNexusCharacterStats.def}</p>
                             <div className="flex items-center gap-1 mt-2.5">
                                <Label htmlFor="nexusModalMaxMod-def" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>Max Mod:</Label>
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('def', -1)}><Minus className="h-2.5 w-2.5" /></Button>
                                <Input id="nexusModalMaxMod-def" type="number" value={activeCharacterSessionData.sessionDefModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionMaxStatModifierChange('def', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                          </div>
                        <div className={cn("space-y-1", (activeCharacterSessionData.sessionBleedPoints || 0) >= NEXUS_HEMORRHAGE_THRESHOLD ? "border-destructive ring-1 ring-destructive rounded-md p-1" : "p-1")}>
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Droplets className="mr-1.5 h-3 w-3 text-red-400" />Bleed</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusBleedPointsChange('decrement')} disabled={activeCharacterSessionData.sessionBleedPoints === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={activeCharacterSessionData.sessionBleedPoints} className="w-10 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusBleedPointsChange('increment')}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                             <p className="text-xs text-muted-foreground text-right mt-1">Hemorrhage at: {NEXUS_HEMORRHAGE_THRESHOLD}</p>
                             {(activeCharacterSessionData.sessionBleedPoints || 0) >= NEXUS_HEMORRHAGE_THRESHOLD && (
                                <div className="text-xs text-destructive font-bold flex items-center justify-end mt-0.5">
                                <AlertTriangle className="mr-1 h-3 w-3" /> HEMORRHAGE!
                                </div>
                            )}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <div className="flex items-center justify-between mb-0.5">
                                <Label className="flex items-center text-xs font-medium"><Coins className="mr-1.5 h-3 w-3 text-yellow-400" />Session Crypto</Label>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleSessionCryptoChange(sessionCrypto - 1)} disabled={sessionCrypto === 0}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input type="number" readOnly value={sessionCrypto} className="w-12 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleSessionCryptoChange(sessionCrypto + 1)}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                            </div>
                        </div>
                      </div>

                      {(effectiveNexusMeleeWeapon || effectiveNexusRangedWeapon) && (
                        <>
                          <Separator className="my-3"/>
                          <h4 className="text-lg font-semibold text-primary flex items-center mb-2"><Swords className="mr-2 h-5 w-5" /> Weapons</h4>
                          <div className="space-y-3 text-sm">
                            {effectiveNexusMeleeWeapon && (
                              <div className="p-3 bg-muted/20 rounded-md space-y-1">
                                <p className="font-medium text-foreground flex items-center"><MeleeIcon className="mr-2 h-4 w-4 text-orange-400"/> {effectiveNexusMeleeWeapon.name} (Melee)</p>
                                <p>ATK: {effectiveNexusMeleeWeapon.attack}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Label htmlFor="nexusModalMeleeAtkMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>ATK Mod:</Label>
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('melee', 'attack', -1)} disabled={activeCharacterSessionData.sessionMeleeAttackModifier <= -(effectiveNexusMeleeWeapon.attack - activeCharacterSessionData.sessionMeleeAttackModifier) }><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input id="nexusModalMeleeAtkMod" type="number" value={activeCharacterSessionData.sessionMeleeAttackModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('melee', 'attack', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                                {effectiveNexusMeleeWeapon.flavorText && <p className="text-xs text-muted-foreground mt-1">{effectiveNexusMeleeWeapon.flavorText}</p>}
                              </div>
                            )}
                            {effectiveNexusRangedWeapon && (
                              <div className="p-3 bg-muted/20 rounded-md space-y-1">
                                <p className="font-medium text-foreground flex items-center"><Crosshair className="mr-2 h-4 w-4 text-cyan-400"/> {effectiveNexusRangedWeapon.name} (Ranged)</p>
                                <p>ATK: {effectiveNexusRangedWeapon.attack} / RNG: {effectiveNexusRangedWeapon.range}</p>
                                 <div className="flex items-center gap-1 mt-1">
                                    <Label htmlFor="nexusModalRangedAtkMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>ATK Mod:</Label>
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'attack', -1)} disabled={activeCharacterSessionData.sessionRangedAttackModifier <= -(effectiveNexusRangedWeapon.attack - activeCharacterSessionData.sessionRangedAttackModifier)}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input id="nexusModalRangedAtkMod" type="number" value={activeCharacterSessionData.sessionRangedAttackModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'attack', 1)}><Plus className="h-2.5 w-2.5" /></Button>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <Label htmlFor="nexusModalRangedRngMod" className="text-xs text-muted-foreground whitespace-nowrap flex items-center"><Settings className="mr-1 h-3 w-3"/>RNG Mod:</Label>
                                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => handleNexusSessionWeaponStatModifierChange('ranged', 'range', -1)} disabled={activeCharacterSessionData.sessionRangedRangeModifier <= -(effectiveNexusRangedWeapon.range - activeCharacterSessionData.sessionRangedRangeModifier)}><Minus className="h-2.5 w-2.5" /></Button>
                                    <Input id="nexusModalRangedRngMod" type="number" value={activeCharacterSessionData.sessionRangedRangeModifier} readOnly className="w-8 h-5 text-center p-0 text-xs font-semibold" />
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
                          <Separator className="my-3"/>
                          <h4 className="text-lg font-semibold text-primary flex items-center mb-2"><Briefcase className="mr-2 h-5 w-5" /> Arsenal Weapons &amp; Gear</h4>
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
                            {effectiveNexusCharacterAbilities.baseAbilities.length > 0 && (
                                <div className="space-y-3 mt-3">
                                    <Separator className="my-3"/>
                                    <h5 className="text-lg font-semibold text-primary flex items-center mb-2"><BookMarked className="mr-2 h-5 w-5" /> Character Abilities:</h5>
                                    {effectiveNexusCharacterAbilities.baseAbilities.map(ability => ( 
                                        <AbilityCard 
                                            key={`modal-base-ability-${ability.id}`} 
                                            ability={ability} 
                                            currentCooldown={activeCharacterSessionData.abilityCooldowns[ability.id]} 
                                            maxCooldown={parseCooldownRounds(ability.cooldown)} 
                                            onIncrementCooldown={() => handleIncrementNexusCooldown(ability.id)} 
                                            onDecrementCooldown={() => handleDecrementNexusCooldown(ability.id)} 
                                            currentQuantity={activeCharacterSessionData.abilityQuantities[ability.id]} 
                                            maxQuantity={ability.maxQuantity} 
                                            onIncrementQuantity={() => handleIncrementNexusQuantity(ability.id)} 
                                            onDecrementQuantity={() => handleDecrementNexusQuantity(ability.id)} 
                                        /> 
                                    ))} 
                                </div>
                            )}

                            {effectiveNexusCharacterAbilities.arsenalAbilities.length > 0 && (
                                <div className="space-y-3 mt-3">
                                    <Separator className="my-3"/>
                                    <h5 className="text-lg font-semibold text-primary flex items-center mb-2"><Sparkles className="mr-2 h-5 w-5" /> Arsenal-Granted Abilities:</h5>
                                    {effectiveNexusCharacterAbilities.arsenalAbilities.map(ability => ( 
                                        <AbilityCard 
                                            key={`modal-arsenal-ability-${ability.id}`} 
                                            ability={ability} 
                                            currentCooldown={activeCharacterSessionData.abilityCooldowns[ability.id]} 
                                            maxCooldown={parseCooldownRounds(ability.cooldown)} 
                                            onIncrementCooldown={() => handleIncrementNexusCooldown(ability.id)} 
                                            onDecrementCooldown={() => handleDecrementNexusCooldown(ability.id)} 
                                            currentQuantity={activeCharacterSessionData.abilityQuantities[ability.id]} 
                                            maxQuantity={ability.maxQuantity} 
                                            onIncrementQuantity={() => handleIncrementNexusQuantity(ability.id)} 
                                            onDecrementQuantity={() => handleDecrementNexusQuantity(ability.id)} 
                                        /> 
                                    ))} 
                                </div>
                            )}
                        </>
                      )}
                      {(effectiveNexusCharacterAbilities.baseAbilities.length === 0 && effectiveNexusCharacterAbilities.arsenalAbilities.length === 0) && (
                         <> <Separator className="my-3"/> <p className="text-sm text-muted-foreground text-center py-3">No abilities defined.</p> </>
                      )}

                      {activeCharacterBase.skills && Object.values(activeCharacterBase.skills).some(val => val && val > 0) && (
                        <> 
                          <Separator className="my-3"/>
                          <h4 className="text-lg font-semibold text-primary flex items-center mb-2"><ListChecks className="mr-2 h-5 w-5" /> Skills</h4>
                          <div className="space-y-2 text-sm">
                           {skillDefinitions.map(skillDef => { 
                              const skillValue = activeCharacterBase.skills?.[skillDef.id as SkillName] || 0; 
                              if (skillValue > 0) { 
                                const IconComponent = getSkillIcon(skillDef.id as SkillName); 
                                return ( 
                                  <div key={skillDef.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-sm">
                                    <span className="flex items-center"><IconComponent className="mr-2 h-4 w-4 text-muted-foreground" /> {skillDef.label}</span> 
                                    <span>{skillValue}</span> 
                                  </div> 
                                ); 
                              } 
                              return null; 
                            })} 
                          </div>
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

          <Dialog 
            open={!!enlargedModalContent} 
            onOpenChange={(isOpen) => { if (!isOpen) setEnlargedModalContent(null); }}
          >
            <DialogContent 
              className="max-w-5xl w-[95vw] h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center" 
              onInteractOutside={(e) => { 
                  if (imageZoomLevel > 1) { 
                      setImageZoomLevel(1); 
                      e.preventDefault(); 
                  } else if (enlargedModalContent) { 
                      setEnlargedModalContent(null);
                  } 
              }}
            >
              <DialogHeader>
                  <VisuallyHidden>
                    <DialogTitle>Enlarged Image View</DialogTitle>
                    <DialogDescription>
                      Showing an enlarged view of the selected card or image. Click or swipe arsenal cards to flip. Double click to zoom.
                    </DialogDescription>
                  </VisuallyHidden>
              </DialogHeader>
              {currentModalImageSrc && enlargedModalContent && (
                <div 
                  className="relative w-full h-full flex items-center justify-center overflow-hidden" 
                  onDoubleClick={handleImageDoubleClick} 
                  onTouchStart={handleTouchStart} 
                  onTouchMove={handleTouchMove} 
                  onTouchEnd={handleTouchEnd} 
                  onClick={handleModalImageInteraction}
                  style={{ cursor: imageZoomLevel > 1 ? 'zoom-out' : (currentModalImageSrc ? 'zoom-in' : 'default')}}
                >
                  <Image 
                    src={currentModalImageSrc} 
                    alt={enlargedModalContent.altText} 
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

           {/* Save Nexus Session Dialog */}
          <Dialog open={isSaveNexusDialogOpen} onOpenChange={setIsSaveNexusDialogOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle>Save Nexus Session</DialogTitle>
                <DialogDescription>
                  Enter a name for this Nexus session state. This will save all team members, their current stats, modifiers, arsenals, and session crypto. 
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="saveNexusName" className="text-right col-span-1">
                    Save Name
                  </Label>
                  <Input
                    id="saveNexusName"
                    value={saveNexusName}
                    onChange={(e) => setSaveNexusName(e.target.value)}
                    className="col-span-3"
                    disabled={isSavingNexus}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSaveNexusDialogOpen(false)} disabled={isSavingNexus}>
                  Cancel
                </Button>
                <Button type="button" onClick={executeSaveNexusState} disabled={isSavingNexus || !saveNexusName.trim() || teamMembers.length === 0}> 
                  {isSavingNexus ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Session"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Session Confirmation Dialog */}
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Nexus Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will clear the current team, all stats, modifiers, arsenal selections, crypto, and any session-specific progress. This cannot be undone. 
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsResetDialogOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeResetNexusSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Reset Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Load Saved Nexus Session Dialog */}
           <Dialog open={isLoadNexusDialogOpen} onOpenChange={setIsLoadNexusDialogOpen}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle>Load Saved Nexus Session</DialogTitle>
                <DialogDescription>Select a previously saved session to load.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] mt-4 pr-3">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : savedNexusSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No saved sessions found.</p>
                ) : (
                  <div className="space-y-2">
                    {savedNexusSessions.map((session) => (
                      <Card key={session.id} className="p-3 bg-muted/30 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Team: {session.party.map(p => p.characterName || p.baseCharacterId).join(', ') || "Empty"} 
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saved: {new Date(session.lastSaved).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleLoadSelectedSession(session)}>Load</Button>
                          <Button variant="destructive" size="sm" onClick={() => confirmDeleteSession(session)} disabled={isDeletingSession}>
                            {isDeletingSession && sessionToDelete?.id === session.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm Delete Session Dialog */}
          <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Saved Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the session "{sessionToDelete?.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSessionToDelete(null)} disabled={isDeletingSession}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeDeleteSession} disabled={isDeletingSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {isDeletingSession ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </TooltipProvider>
    </>
  );
}


