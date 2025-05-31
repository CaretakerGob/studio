
"use client";

import type { ChangeEvent } from 'react';
import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardTitle, CardDescription, CardFooter, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Save, Swords, Library, PawPrint, Shirt,
  Heart, Shield, Footprints, Brain, Laptop, Star as StarIconLucide, VenetianMask,
  HeartHandshake, Wrench, Search, BookMarked, Smile, Leaf, ClipboardList, SlidersHorizontal, PersonStanding,
  Package, WandSparkles, UserCog, Eye, Copy, Trash2, Edit3, CircleDot, Users, AlertCircle,
  Sword as MeleeIcon,
  Star, 
  Settings,
  UserMinus,
  UserPlus,
  BookOpen,
  Zap,
  ShieldAlert,
  Sparkles,
  ShoppingCart,
  Minus,
  Plus,
  Clock,
  Box,
  Coins,
  Droplets // Added Droplets icon
} from "lucide-react";
import type { CharacterStats, StatName, Character, Ability, AbilityType, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition } from '@/types/character';
import type { ArsenalCard as ActualArsenalCard, ArsenalItem } from '@/types/arsenal';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/context/auth-context";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

import { CharacterHeader } from './character-header';
import { CoreStatsSection, customStatPointBuyConfig } from './core-stats-section';
import { WeaponDisplay } from './weapon-display';
import { SkillsSection } from './skills-section';
import { AbilityCard } from './ability-card';
import { AbilitiesSection } from './abilities-section';
import { ArsenalTabContent } from './arsenal-tab-content';


const initialCustomCharacterStats: CharacterStats = {
  hp: 1, maxHp: 1,
  mv: 1,
  def: 1,
  sanity: 1, maxSanity: 1,
  meleeAttack: 0,
};

const initialSkills: Skills = {
  ath: 0, cpu: 0, dare: 0, dec: 0, emp: 0, eng: 0, inv: 0, kno: 0, occ: 0, pers: 0, sur: 0, tac: 0, tun: 0,
};

export const skillDefinitions: SkillDefinition[] = [
  { id: 'ath', label: "Athletics (ATH)", description: "Prowess at swimming, running, tumbling, and parkour.", icon: PersonStanding },
  { id: 'cpu', label: "Computer Use (CPU)", description: "Adept at hacking, online research, and navigating networks.", icon: Laptop },
  { id: 'dare', label: "Dare Devil (DARE)", description: "Fearless and skilled driver/pilot, performs spectacular stunts.", icon: StarIconLucide },
  { id: 'dec', label: "Deception (DEC)", description: "Skill in lying, manipulation, sleight of hand, and stealth.", icon: VenetianMask },
  { id: 'emp', label: "Empathy (EMP)", description: "Ability to triage, tutor, handle animals, and sense motives.", icon: HeartHandshake },
  { id: 'eng', label: "Engineer (ENG)", description: "Proficiency in crafting, repairing, using machinery, and disabling devices.", icon: Wrench },
  { id: 'inv', label: "Investigate (INV)", description: "Ability to gather info, find clues, and research.", icon: Search },
  { id: 'kno', label: "Knowledge (KNO)", description: "Filled with useful facts on various subjects (not Occult, Eng, CPU).", icon: Library },
  { id: 'occ', label: "Occult (OCC)", description: "Knowledge of rituals, demonology, alchemy, and ancient scripts.", icon: BookMarked },
  { id: 'pers', label: "Personality (PERS)", description: "Inner willpower and charisma (Inspirational or Intimidating).", icon: Smile },
  { id: 'sur', label: "Survivalist (SUR)", description: "Skilled at living off the land, tracking, and navigation.", icon: Leaf },
  { id: 'tac', label: "Tactician (TAC)", description: "Observant, spots details, predicts enemy plans. +1 to turn order roll /2 pts.", icon: ClipboardList },
  { id: 'tun', label: "Tuner (TUN)", description: "Rare individuals born with or acquired skill for visions, sensing danger.", icon: SlidersHorizontal },
];

export const charactersData: Character[] = [
  {
    id: 'custom',
    name: 'Custom Character',
    baseStats: { ...initialCustomCharacterStats },
    skills: { ...initialSkills },
    abilities: [],
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'customcharacter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FCustom%20Character%20silhouette.png?alt=media&token=2b64a81c-42cf-4f1f-82ac-01b9ceae863b',
    meleeWeapon: { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" },
    rangedWeapon: { name: "Thrown Rock", attack: 1, range: 3, flavorText: "A hastily thrown rock" },
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'gob',
    name: 'Gob',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, tac: 3, sur: 2, kno: 3 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'gob',
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FGob%20front%201.png?alt=media&token=50020f87-b211-4a89-8232-8be16a3d513e`,
    meleeWeapon: { name: "Knife", attack: 2 },
    rangedWeapon: { name: "AR-15", attack: 4, range: 5 },
    abilities: [
      { id: 'gob_vital_shot', name: 'Vital Shot', type: 'Action', description: 'Re-rolls 2 missed Attack Dice.', details: 'A4/R5 - PHYS', cooldown: '2 round CD', cost: 50 },
      { id: 'gob_wounding_strike', name: 'Wounding Strike', type: 'Action', description: 'Bypasses Targets Armor Effect. Damaged targets are WOUNDED for 2 rounds.', details: 'A3/R1', cost: 50 },
      { id: 'gob_leadership', name: 'Leadership', type: 'Action', description: 'Roll 1 combat dice. Allies within 2 spaces increase their Attack or Defense by 1 for 1 round on a HIT.', cost: 50 },
      { id: 'gob_quick_draw', name: 'Quick Draw', type: 'Interrupt', description: 'Push target back 1 space for each HIT.', details: 'A3/R3', cooldown: '2 round CD', cost: 50 },
      { id: 'gob_flare_x3', name: 'Flare x3', type: 'Interrupt', description: 'Place a Flare tile on the map. Enemies within 2 spaces cannot STEALTH. Treat as Light Source.', details: 'R6', maxQuantity: 3, cost: 50 },
    ],
    characterPoints: 375,
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    baseStats: { hp: 6, maxHp: 6, mv: 4, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, occ: 2, emp: 2, tun: 1 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'cassandra',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FCassandra%20front%201.png?alt=media&token=20d48903-12e7-4b7b-be18-14b7e32aa5bc',
    meleeWeapon: { name: "Saber", attack: 3 },
    rangedWeapon: { name: "Wrangler", attack: 3, range: 3 },
    abilities: [
      { id: 'cass_death_knell', name: 'Death Knell', type: 'Action', description: 'Roll 1 additional Attack Dice for each HP Cassandra is below her Max HP.', details: 'A3/R3 - NETHER', cooldown: '3 round CD', cost: 50 },
      { id: 'cass_anoint_weapon', name: 'Anoint Weapon', type: 'Action', description: 'Targets attacks are now of the ETHER element for 2 rounds.', details: 'R4', cost: 50 },
      { id: 'cass_enrage', name: 'Enrage', type: 'Passive', description: "When Cassie's HP falls to 3 or less she gains the BERSERK buff.", cost: 50 },
      { id: 'cass_curse_x4', name: 'Curse x4', type: 'Interrupt', description: 'Target is inflicted with Hex for 1 round.', details: 'R4', maxQuantity: 4, cost: 50 },
      { id: 'cass_healing_light_x4', name: 'Healing Light x4', type: 'Interrupt', description: 'Target regains 1 HP per HIT.', details: 'A3/R4', maxQuantity: 4, cost: 50 },
    ],
    characterPoints: 375,
  },
  {
    id: 'fei',
    name: 'Fei',
    baseStats: { hp: 5, maxHp: 5, mv: 4, def: 2, sanity: 6, maxSanity: 6, meleeAttack: 0 },
    skills: { ...initialSkills, occ: 4, emp: 2, kno: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'fei',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FFei%20front%201.png?alt=media&token=edb4236c-ce3f-4809-8dfb-c9fcc0be303a',
    meleeWeapon: { name: "Punch", attack: 1, flavorText: "A swift punch." },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon." },
    abilities: [
        { id: 'fei_flame_thrower', name: 'Flame Thrower', type: 'Action', description: 'Flamethrower action.', details: 'BEAM - A4/R4 - FIRE', cooldown: '2 round CD', cost: 50 },
        { id: 'fei_shock_grenade', name: 'Shock Grenade', type: 'Action', description: 'Shock grenade action.', details: 'AOE - A3/R4 - ELEC', cooldown: '2 round CD', cost: 50 },
        { id: 'fei_tricks_trade_action', name: 'Tricks of the Trade', type: 'Action', description: 'Choose one of the target\'s Abilities to be disabled for 1 round.', details: 'R6', cost: 50 },
        { id: 'fei_taser_x2', name: 'Taser x2', type: 'Interrupt', description: 'Inflict PARALYZE for 1 round.', details: 'R4', maxQuantity: 2, cost: 50 },
        { id: 'fei_blind_x3', name: 'Blind x3', type: 'Interrupt', description: 'Target is BLIND for 2 rounds.', details: 'R4', maxQuantity: 3, cost: 50 },
        { id: 'fei_immobilize_x4', name: 'Immobilize x4', type: 'Interrupt', description: 'IMMOBILIZE value of 6.', details: 'R4', maxQuantity: 4, cost: 50 },
        { id: 'fei_fanny_pack', name: 'Fanny Pack', type: 'Passive', description: 'Fei can equip 2 Relics or Utility Items without taking up a Gear slot.', cost: 50 },
      ],
    characterPoints: 375,
  },
  {
    id: 'michael',
    name: 'Michael',
    baseStats: { hp: 6, maxHp: 6, mv: 5, def: 3, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, emp: 2, dec: 2, inv: 2, ath: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'michael',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FMichael%20front%201.png?alt=media&token=4589bf01-5104-424f-8055-8f35edb2aea3',
    meleeWeapon: { name: "Kunai", attack: 3 },
    rangedWeapon: { name: "Kunai", attack: 4, range: 2 },
    abilities: [
      { id: 'michael_sneak_attack', name: 'Sneak Attack', type: 'Action', details: 'A2/R2', description: 'Target can roll max of 1 Defense from this Attack.', cost: 50 },
      { id: 'michael_whip_maneuver', name: 'Whip Maneuver', type: 'Action', details: 'R3', description: 'Roll 3 combat dice. Move target 1 space for each HIT.', cost: 50 },
      { id: 'michael_disarm', name: 'Disarm', type: 'Interrupt', details: 'R3', description: 'Target is DISARMED for 1 round.', cooldown: '2 round CD', cost: 50 },
      { id: 'michael_morphine_x3', name: 'Morphine x3', type: 'Interrupt', details: 'R3', description: 'Target gains a WARD of 2 but loses 1 Sanity.', maxQuantity: 3, cost: 50 },
      { id: 'michael_shady', name: 'Shady', type: 'Passive', description: 'Michael gains the STEALTH buff. Critical Hits triggered by Michael inflict 1 BLEED Point on the target.', cost: 50 },
      { id: 'michael_nimble_fingers', name: 'Nimble Fingers', type: 'Passive', description: 'Michael can use 2 Interrupt Actions per round.', cost: 50 },
    ],
    characterPoints: 375,
  },
  {
    id: 'tamara',
    name: 'Tamara',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 4, sanity: 6, maxSanity: 6, meleeAttack: 0 },
    skills: { ...initialSkills, emp: 4, pers: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'tamara',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FTamara%20front%201.png?alt=media&token=b1a57842-f145-4fa7-b239-18ec2977dd8c',
    meleeWeapon: { name: "Martial Arts", attack: 2 },
    rangedWeapon: { name: "M7", attack: 3, range: 3 },
    abilities: [
      { id: 'tamara_combat_medic', name: 'Combat Medic', type: 'Action', description: 'Target is Healed 1 HP for each HIT rolled.', details: 'A4/R4', cooldown: '2 round CD', cost: 50 },
      { id: 'tamara_poison', name: 'Poison', type: 'Action', description: 'Target is afflicted with POISON for 2 rounds.', details: 'R3', cost: 50 },
      { id: 'tamara_potion_of_amplification_x3', name: 'Potion of Amplification x3', type: 'Interrupt', description: 'Place Amplification Cloud on map. See Rules.', details: 'R4 - AOE', maxQuantity: 3, cost: 50 },
      { id: 'tamara_team_player', name: 'Team Player', type: 'Interrupt', description: 'Friendly target can use any of their Actions as a Free Action.', details: 'R6', cooldown: '2 round CD', cost: 50 },
      { id: 'tamara_bloody_knuckles', name: 'Bloody Knuckles', type: 'Passive', description: "Using a Melee Attack lowers all of Tammy's cooldowns by 1 round. Tammy is immune to Attacks of Opportunity.", cost: 50 },
    ],
    characterPoints: 375,
  },
  {
    id: 'trish',
    name: 'Trish',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, ath: 3, pers: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'trish',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FTrish%20front%201.png?alt=media&token=d33490c7-2eff-4abb-8c5d-e260378b7c34',
    meleeWeapon: { name: "Katana", attack: 4 },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" },
    abilities: [
      { id: 'trish_clean_cut', name: 'Clean Cut', type: 'Action', details: 'R1', description: 'Inflicts 4 damage, cannot Critically Hit or be used with Double Attack.', cost: 50},
      { id: 'trish_counter_strike_x2', name: 'Counter Strike x2', type: 'Interrupt', description: 'Reverse melee attack targetting Trish back to the attacker.', maxQuantity: 2, cost: 50},
      { id: 'trish_deflection_x2', name: 'Deflection x2', type: 'Interrupt', description: 'Negate Ranged Attack targeting Trish or an adjacent ally.', maxQuantity: 2, cost: 50},
      { id: 'trish_double_attack', name: 'Double Attack', type: 'Passive', description: 'If Trish has not taken a Move Action this round she can make a second Melee Attack.', cost: 50},
      { id: 'trish_iron_will', name: 'Iron Will', type: 'Passive', description: 'Everytime Trish inflicts damage she can restore the use of 1 of her Interrupts by 1. This cannot exceed initial count.', cost: 50},
    ],
    characterPoints: 375,
  },
  {
    id: 'blake',
    name: 'Blake',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, eng: 2, sur: 2, tac: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'blake',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FBlake%20Back.png?alt=media&token=93ab27db-954b-4fac-ab31-a10337e74529',
    meleeWeapon: { name: "Kukri", attack: 4 },
    rangedWeapon: { name: "Outlaw .44", attack: 3, range: 3 },
    abilities: [
      { id: 'blake_mark_target', name: 'Mark Target', type: 'Action', details: 'R8', description: 'Target is MARKED for 1 round.', cost: 50},
      { id: 'blake_restock', name: 'Restock', type: 'Action', description: "Restock one of Blake's Interrupts by 1. Cannot exceed initial count.", cost: 50},
      { id: 'blake_shotgun_x2', name: 'Shotgun x2', type: 'Interrupt', details: 'BEAM - A4/R3 - PHYS', description: 'Interrupt Attack.', maxQuantity: 2, cost: 50},
      { id: 'blake_barricade_x1', name: 'Barricade x1', type: 'Interrupt', details: 'R2', description: 'Any allies adjacent of the Barricade gain the COVER Buff for 2 rounds.', maxQuantity: 1, cost: 50},
      { id: 'blake_tricks_trade_x1', name: 'Tricks of the Trade x1', type: 'Interrupt', details: 'R4', description: 'Inflict TRICKS OF THE TRADE for 1 round.', maxQuantity: 1, cost: 50},
      { id: 'blake_multi_attack', name: 'Multi-Attack', type: 'Passive', description: 'Re-roll 1 missed Attack dice. Max once per round.', cost: 50},
    ],
    characterPoints: 375,
  },
  {
    id: 'walter',
    name: 'Walter',
    baseStats: { hp: 9, maxHp: 9, mv: 4, def: 4, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, dare: 2, cpu: 2, pers: 2 },
    crypto: 0,
    bleedPoints: 0,
    avatarSeed: 'walter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Characters%2FHunters%2FWalter%20back.png?alt=media&token=ef9ee84f-6c26-4452-ae9a-c2279ead4df7',
    meleeWeapon: { name: "Mace", attack: 3 },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" },
    abilities: [
      { id: 'walter_wild_swing', name: 'Wild Swing', type: 'Action', details: 'A4/R1 - CLEAVE', description: 'CLEAVE. 1 round CD.', cooldown: '1 round CD', cost: 50},
      { id: 'walter_swap_out', name: 'Swap Out', type: 'Action', description: 'Walter swaps between Arsenals.', cost: 50},
      { id: 'walter_blow_for_blow', name: 'Blow for Blow', type: 'Interrupt', details: 'R1', description: 'Walter Lowers the targets Defense by 1 for 1 round. 2 round CD.', cooldown: '2 round CD', cost: 50},
      { id: 'walter_intervene_x4', name: 'Intervene x4', type: 'Interrupt', details: 'R4', description: 'Walter takes space of another unit within range. Unit is moved to an adjacent open space.', maxQuantity: 4, cost: 50},
      { id: 'walter_parry', name: 'Parry', type: 'Passive', description: 'Double Swords count as a block. Does not count for Perfect Defense. Allies adjacent to Walter also benefit from Parry.', cost: 50},
      { id: 'walter_load_out', name: 'Load Out', type: 'Passive', description: 'Walter can store 1 backup Arsenal that must be picked at the start of the Investigation.', cost: 50},
    ],
    characterPoints: 375,
  },
];

type AbilityWithCost = Ability & { cost: number };

export const allUniqueAbilities: AbilityWithCost[] = (() => {
  const abilitiesMap = new Map<string, AbilityWithCost>();
  charactersData.forEach(character => {
    if (character.id === 'custom') return; 
    character.abilities.forEach(ability => {
      if (!abilitiesMap.has(ability.id)) {
        abilitiesMap.set(ability.id, { ...ability, cost: ability.cost === undefined ? 50 : ability.cost });
      }
    });
  });
  return Array.from(abilitiesMap.values());
})();

const SKILL_COST_LEVEL_1 = 10;
const SKILL_COST_LEVEL_2 = 5;
const SKILL_COST_LEVEL_3 = 10;

interface CharacterSheetUIProps {
  arsenalCards: ActualArsenalCard[];
}

export function CharacterSheetUI({ arsenalCards: rawArsenalCards }: CharacterSheetUIProps) {
  const { currentUser, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
  const arsenalCards = rawArsenalCards || [];


  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [editableCharacterData, setEditableCharacterData] = useState<Character | null>(null);
  const [userSavedCharacters, setUserSavedCharacters] = useState<Character[]>([]);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  const [abilityToAddId, setAbilityToAddId] = useState<string | undefined>(undefined);
  const [skillToPurchase, setSkillToPurchase] = useState<SkillName | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true); 
  const [initialIdProcessed, setInitialIdProcessed] = useState(false);

  const [currentBleedPoints, setCurrentBleedPoints] = useState(0);
  const [currentPetHp, setCurrentPetHp] = useState<number | null>(null);
  const [currentPetSanity, setCurrentPetSanity] = useState<number | null>(null);
  const [currentPetMv, setCurrentPetMv] = useState<number | null>(null);
  const [currentPetDef, setCurrentPetDef] = useState<number | null>(null);
  
  const [sessionMaxHpModifier, setSessionMaxHpModifier] = useState(0);
  const [sessionMaxSanityModifier, setSessionMaxSanityModifier] = useState(0);


  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showToastHelper = useCallback((options: { title: string; description: string; variant?: "default" | "destructive" }) => {
    setTimeout(() => {
        toast(options);
    }, 0);
  }, [toast]);

  const parseCooldownRounds = useCallback((cooldownString?: string | number): number | undefined => {
    if (typeof cooldownString === 'number') return cooldownString;
    if (!cooldownString) return undefined;
    const match = String(cooldownString).match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }, []);


  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadParam = searchParams.get('load');

    if (loadParam && !initialIdProcessed) {
      setSelectedCharacterId(loadParam);
      setInitialIdProcessed(true);
      const newUrl = typeof window !== "undefined" ? new URL(window.location.href) : null;
      if (newUrl) {
        newUrl.searchParams.delete('load');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }
      return; 
    }

    if (!selectedCharacterId && !initialIdProcessed) { 
      let newSelectedIdToSet = charactersData[0].id; 

      if (currentUser) {
        const prefsDocRef = doc(db, "userCharacters", currentUser.uid, "preferences", "userPrefs");
        getDoc(prefsDocRef).then(docSnap => {
          if (docSnap.exists()) {
            const userDefaultId = docSnap.data()?.defaultCharacterId;
            const isValidDefault = userDefaultId &&
                                   (charactersData.some(c => c.id === userDefaultId) ||
                                    userSavedCharacters.some(c => c.id === userDefaultId));
            if (isValidDefault) {
              newSelectedIdToSet = userDefaultId;
            }
          }
          setSelectedCharacterId(newSelectedIdToSet);
          setInitialIdProcessed(true);
        }).catch(err => {
          console.error("Error fetching default character preference:", err);
          setSelectedCharacterId(charactersData[0].id);
          setInitialIdProcessed(true);
        });
      } else {
        setSelectedCharacterId(newSelectedIdToSet);
        setInitialIdProcessed(true);
      }
    } else if (!initialIdProcessed && selectedCharacterId) {
        setInitialIdProcessed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUser, authLoading, initialIdProcessed]); 

  const loadCharacterData = useCallback(async () => {
      if (!selectedCharacterId) {
        setIsLoadingCharacter(false);
        setEditableCharacterData(null);
        return;
      }

      setIsLoadingCharacter(true);
      if (setAuthError) setAuthError(null);

      let characterToLoad: Character | undefined | null = undefined;
      
      try {
        if (selectedCharacterId === 'custom') {
          characterToLoad = charactersData.find(c => c.id === 'custom') ? JSON.parse(JSON.stringify(charactersData.find(c => c.id === 'custom'))) : null;
          if(characterToLoad) characterToLoad.templateId = 'custom';
        } else if (currentUser && auth.currentUser) {
          const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", selectedCharacterId);
          const docSnap = await getDoc(characterRef);
          if (docSnap.exists()) {
              characterToLoad = { id: docSnap.id, ...docSnap.data() } as Character;
              if (!characterToLoad.templateId) {
                characterToLoad.templateId = charactersData.some(c => c.id === docSnap.id) ? docSnap.id : 'custom';
              }
              showToastHelper({ title: "Saved Character Loaded", description: `Loaded your saved version of ${characterToLoad.name || characterToLoad.id}.` });
          } else {
              const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);
              characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
              if (characterToLoad && defaultTemplate) characterToLoad.templateId = defaultTemplate.id;
               if (defaultTemplate) {
                  showToastHelper({ title: "Default Loaded", description: `Loaded default template for ${defaultTemplate.name || selectedCharacterId}. No saved version found.` });
              }
          }
        } else {
          const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);
          characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
          if (characterToLoad && defaultTemplate) characterToLoad.templateId = defaultTemplate.id;
        }

        if (characterToLoad) {
          const baseTemplateForStats = charactersData.find(c => c.id === (characterToLoad?.templateId || characterToLoad?.id || 'custom'));
          if (!baseTemplateForStats) {
            showToastHelper({ title: "Error", description: `Base template for ${characterToLoad.name} not found.`, variant: "destructive" });
            setEditableCharacterData(null);
          } else {
            characterToLoad.baseStats = { ...(baseTemplateForStats.baseStats || initialCustomCharacterStats) , ...characterToLoad.baseStats };
            characterToLoad.skills = { ...(baseTemplateForStats.skills || initialSkills) , ...characterToLoad.skills };
            characterToLoad.abilities = Array.isArray(characterToLoad.abilities) ? characterToLoad.abilities : (baseTemplateForStats.abilities || []);
            characterToLoad.crypto = characterToLoad.crypto === undefined ? 0 : characterToLoad.crypto; 
            characterToLoad.bleedPoints = characterToLoad.bleedPoints === undefined ? 0 : characterToLoad.bleedPoints;
            setCurrentBleedPoints(characterToLoad.bleedPoints);
            characterToLoad.savedCooldowns = characterToLoad.savedCooldowns || {};
            characterToLoad.savedQuantities = characterToLoad.savedQuantities || {};
            setEditableCharacterData(characterToLoad);
          }
        } else {
            const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);
            if (defaultTemplate){
                let fallbackChar: Character = JSON.parse(JSON.stringify(defaultTemplate));
                fallbackChar.templateId = selectedCharacterId;
                fallbackChar.crypto = 0; 
                fallbackChar.bleedPoints = 0;
                setCurrentBleedPoints(0);
                setEditableCharacterData(fallbackChar);
                showToastHelper({ title: "Default Loaded", description: `Loaded default template for ${defaultTemplate.name || selectedCharacterId}.`, variant: "destructive" });
            } else {
                setEditableCharacterData(null);
                setCurrentBleedPoints(0);
                showToastHelper({ title: "Error", description: `Template for ID "${selectedCharacterId}" not found. Cannot load character.`, variant: "destructive" });
            }
        }
        setAbilityToAddId(undefined);
        setSkillToPurchase(undefined);
        setSessionMaxHpModifier(0);
        setSessionMaxSanityModifier(0);
      } catch (err: any) {
          const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);
          characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
          if (characterToLoad && defaultTemplate) {
            characterToLoad.templateId = defaultTemplate.id;
            characterToLoad.crypto = 0;
            characterToLoad.bleedPoints = 0;
            setCurrentBleedPoints(0);
          }
          setEditableCharacterData(characterToLoad);
          showToastHelper({ title: "Load Failed", description: "Could not load character data. Loading default.", variant: "destructive" });
      } finally {
        setIsLoadingCharacter(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterId, currentUser, setAuthError, showToastHelper]);

  useEffect(() => {
    if (selectedCharacterId && initialIdProcessed) {
      loadCharacterData();
    } else if (!selectedCharacterId && initialIdProcessed) {
        setIsLoadingCharacter(false);
        setEditableCharacterData(null);
    } 
  }, [loadCharacterData, selectedCharacterId, initialIdProcessed]);

  const equippedArsenalCard = useMemo(() => {
    if (!editableCharacterData?.selectedArsenalCardId || !arsenalCards || arsenalCards.length === 0) {
      return null;
    }
    const card = arsenalCards.find(card => card.id === editableCharacterData.selectedArsenalCardId);
    if (!card) return null;
    if (card.id.startsWith('error-') || card.id.startsWith('warning-')) return null;
    return card;
  }, [editableCharacterData?.selectedArsenalCardId, arsenalCards]);

  const effectiveAbilities = useMemo(() => {
    if (!editableCharacterData) return [];
    let baseAbilities = editableCharacterData.abilities ? [...editableCharacterData.abilities] : [];
    const arsenalGrantedAbilities: Ability[] = [];

    if (equippedArsenalCard && equippedArsenalCard.items) {
        equippedArsenalCard.items.forEach(item => {
            const createAbilityFromFlag = (type: AbilityType, flag: boolean | undefined, flagSource: string) => {
                if (flag === true) {
                    arsenalGrantedAbilities.push({
                        id: `arsenal-${equippedArsenalCard.id}-${item.id}-${type.replace(/\s+/g, '')}-${flagSource}`,
                        name: item.abilityName || `Arsenal ${type}`,
                        type: type,
                        description: item.itemDescription || item.effect || `Granted by ${item.abilityName || 'equipped arsenal'}.`,
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
    return [...baseAbilities, ...arsenalGrantedAbilities];
  }, [editableCharacterData?.abilities, equippedArsenalCard]);


  const abilitiesJSONKey = useMemo(() => JSON.stringify(effectiveAbilities), [effectiveAbilities]);
  const savedCooldownsJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.savedCooldowns), [editableCharacterData?.savedCooldowns]);
  const savedQuantitiesJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.savedQuantities), [editableCharacterData?.savedQuantities]);


  const [currentAbilityCooldowns, setCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [maxAbilityCooldowns, setMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [currentAbilityQuantities, setCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [maxAbilityQuantities, setMaxAbilityQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (editableCharacterData && effectiveAbilities) {
      const newMaxCDs: Record<string, number> = {};
      const newInitialCurrentCDs: Record<string, number> = {};
      const newMaxQTs: Record<string, number> = {};
      const newInitialCurrentQTs: Record<string, number> = {};

      const savedCDs = editableCharacterData.savedCooldowns || {};
      const savedQTs = editableCharacterData.savedQuantities || {};

      effectiveAbilities.forEach(ability => {
        if (ability.cooldown && (ability.type === 'Action' || ability.type === 'Interrupt' || ability.type === 'FREE Action')) {
          const maxRounds = parseCooldownRounds(String(ability.cooldown));
          if (maxRounds !== undefined) {
            newMaxCDs[ability.id] = maxRounds;
            const isBaseAbility = editableCharacterData.abilities.find(ba => ba.id === ability.id); 
            if (isBaseAbility && savedCDs[ability.id] !== undefined) {
              newInitialCurrentCDs[ability.id] = savedCDs[ability.id];
            } else {
              newInitialCurrentCDs[ability.id] = maxRounds; 
            }
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt' || ability.type === 'FREE Action')) {
          newMaxQTs[ability.id] = ability.maxQuantity;
           const isBaseAbility = editableCharacterData.abilities.find(ba => ba.id === ability.id);
           if (isBaseAbility && savedQTs[ability.id] !== undefined) {
             newInitialCurrentQTs[ability.id] = savedQTs[ability.id];
           } else {
             newInitialCurrentQTs[ability.id] = ability.maxQuantity; 
           }
        }
      });

      setMaxAbilityCooldowns(newMaxCDs);
      setCurrentAbilityCooldowns(newInitialCurrentCDs);
      setMaxAbilityQuantities(newMaxQTs);
      setCurrentAbilityQuantities(newInitialCurrentQTs);
    } else {
      setMaxAbilityCooldowns({});
      setCurrentAbilityCooldowns({});
      setMaxAbilityQuantities({});
      setCurrentAbilityQuantities({});
    }
  }, [
      editableCharacterData?.id,
      abilitiesJSONKey,
      savedCooldownsJSONKey,
      savedQuantitiesJSONKey,
      parseCooldownRounds,
      editableCharacterData?.abilities, 
    ]);

  useEffect(() => {
    const fetchUserSavedCharacters = async () => {
      if (currentUser && auth.currentUser) {
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
          setUserSavedCharacters(chars.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));
        } catch (err) {
          showToastHelper({ title: "Load Error", description: "Could not fetch list of saved characters.", variant: "destructive"});
          setUserSavedCharacters([]);
        }
      } else {
        setUserSavedCharacters([]);
      }
    };
    if (!authLoading) {
        fetchUserSavedCharacters();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isSaving, authLoading]);

  const characterDropdownOptions = useMemo(() => {
    const optionsMap = new Map<string, { id: string; name: string; displayNameInDropdown: string; isSaved: boolean }>();
    const defaultCustomTemplate = charactersData.find(c => c.id === 'custom');
    const defaultCustomName = defaultCustomTemplate?.name || "Custom Character";

    charactersData.forEach(templateChar => {
      optionsMap.set(templateChar.id, {
        id: templateChar.id,
        name: templateChar.name,
        displayNameInDropdown: templateChar.name,
        isSaved: false,
      });
    });

    userSavedCharacters.forEach(savedChar => {
      const baseTemplateForSaved = charactersData.find(c => c.id === (savedChar.templateId || savedChar.id));
      let optionName = savedChar.name || savedChar.id;
      let displayNameInDropdown;

      if (savedChar.templateId === 'custom') {
        displayNameInDropdown = (savedChar.name && savedChar.name !== defaultCustomName)
                                ? `${savedChar.name} (Custom Character)`
                                : `${defaultCustomName} (Saved)`;
      } else if (baseTemplateForSaved) {
        displayNameInDropdown = (savedChar.name && savedChar.name !== baseTemplateForSaved.name)
                                ? `${savedChar.name} (${baseTemplateForSaved.name})`
                                : `${baseTemplateForSaved.name} (Saved)`;
      } else {
        displayNameInDropdown = `${optionName} (Saved)`;
      }

      optionsMap.set(savedChar.id, {
        id: savedChar.id,
        name: optionName,
        displayNameInDropdown: displayNameInDropdown,
        isSaved: true,
      });
    });

    if (editableCharacterData && optionsMap.has(selectedCharacterId)) {
        const option = optionsMap.get(selectedCharacterId)!;
        const baseTemplateForCurrent = charactersData.find(c => c.id === (editableCharacterData.templateId || selectedCharacterId));

        if (editableCharacterData.id === 'custom') {
          if (editableCharacterData.name === defaultCustomName && !option.isSaved) {
            option.displayNameInDropdown = defaultCustomName;
          } else if (editableCharacterData.name && editableCharacterData.name !== defaultCustomName) {
            option.displayNameInDropdown = `${editableCharacterData.name} (Custom Character)`;
          } else if (editableCharacterData.name === defaultCustomName && option.isSaved) {
             option.displayNameInDropdown = `${defaultCustomName} (Saved)`;
          }
        } else if (baseTemplateForCurrent) {
            if (editableCharacterData.name === baseTemplateForCurrent.name && !option.isSaved) {
                option.displayNameInDropdown = baseTemplateForCurrent.name;
            }
            else if (editableCharacterData.name === baseTemplateForCurrent.name && option.isSaved) {
                option.displayNameInDropdown = `${baseTemplateForCurrent.name} (Saved)`;
            }
            else if (editableCharacterData.name && editableCharacterData.name !== baseTemplateForCurrent.name) {
                option.displayNameInDropdown = `${editableCharacterData.name} (${baseTemplateForCurrent.name})`;
            }
        }
        if (option.name !== editableCharacterData.name) {
            option.name = editableCharacterData.name;
        }
        optionsMap.set(selectedCharacterId, option);
    }
    return Array.from(optionsMap.values()).sort((a, b) => a.displayNameInDropdown.localeCompare(b.displayNameInDropdown));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSavedCharacters, selectedCharacterId, editableCharacterData?.name, editableCharacterData?.id, editableCharacterData?.templateId]);


  const handleCharacterDropdownChange = (id: string) => {
    setSelectedCharacterId(id);
  };


  const handleCustomCharacterNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (editableCharacterData?.templateId === 'custom' || editableCharacterData?.id === 'custom' || (editableCharacterData?.id && editableCharacterData.id.startsWith("custom_")) ) {
      setEditableCharacterData(prevData => {
        if (!prevData) return null;
        return { ...prevData, name: e.target.value };
      });
    }
  };

  const handleArsenalCardChange = (arsenalCardId: string | undefined) => {
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      return { ...prevData, selectedArsenalCardId: arsenalCardId === "none" ? null : arsenalCardId };
    });
     const card = arsenalCards.find(c => c.id === arsenalCardId);
     if (card) {
        showToastHelper({title: "Arsenal Equipped", description: `${card.name} equipped.`});
     } else if (arsenalCardId === "none") {
        showToastHelper({title: "Arsenal Unequipped", description: "No arsenal card equipped."});
     }
  };

  const handleStatChange = (statName: StatName, value: number | string) => {
     if (!editableCharacterData || editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) return;
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newStats = { ...prevData.baseStats, [statName]: numericValue };
      if (statName === 'hp') newStats.hp = Math.max(0, Math.min(numericValue, newStats.maxHp + sessionMaxHpModifier));
      if (statName === 'maxHp') newStats.maxHp = Math.max(1, numericValue);
      if (statName === 'sanity') newStats.sanity = Math.max(0, Math.min(numericValue, newStats.maxSanity + sessionMaxSanityModifier));
      if (statName === 'maxSanity') newStats.maxSanity = Math.max(1, numericValue);

      if(statName === 'maxHp' && newStats.hp > (newStats.maxHp + sessionMaxHpModifier)) newStats.hp = newStats.maxHp + sessionMaxHpModifier;
      if(statName === 'maxSanity' && newStats.sanity > (newStats.maxSanity + sessionMaxSanityModifier)) newStats.sanity = newStats.maxSanity + sessionMaxSanityModifier;

      return { ...prevData, baseStats: newStats };
    });

    setHighlightedStat(statName);
    setTimeout(() => setHighlightedStat(null), 300);
  };

  const incrementStat = (statName: StatName) => {
     if (!editableCharacterData || editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) return;
     const currentStats = editableCharacterData.baseStats;
     if (statName === 'hp' && currentStats.hp >= (currentStats.maxHp + sessionMaxHpModifier)) return;
     if (statName === 'sanity' && currentStats.sanity >= (currentStats.maxSanity + sessionMaxSanityModifier)) return;
    handleStatChange(statName, (currentStats[statName] || 0) + 1);
  };

  const decrementStat = (statName: StatName) => {
    if (!editableCharacterData || editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) return;
    handleStatChange(statName, (editableCharacterData.baseStats[statName] || 0) - 1);
  };

  const handleCryptoChange = (value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      return { ...prevData, crypto: Math.max(0, numericValue) };
    });
  };

  const incrementCrypto = () => {
    if (!editableCharacterData) return;
    handleCryptoChange((editableCharacterData.crypto || 0) + 1);
  };

  const decrementCrypto = () => {
    if (!editableCharacterData) return;
    handleCryptoChange((editableCharacterData.crypto || 0) - 1);
  };

  const handleBleedPointsChange = (value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;
    const newBleedPoints = Math.max(0, numericValue);
    setCurrentBleedPoints(newBleedPoints);
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      return { ...prevData, bleedPoints: newBleedPoints };
    });
  };

  const incrementBleedPoints = () => {
    handleBleedPointsChange(currentBleedPoints + 1);
  };

  const decrementBleedPoints = () => {
    handleBleedPointsChange(currentBleedPoints - 1);
  };


  const handlePetStatChange = (statType: 'hp' | 'sanity' | 'mv' | 'def' | 'meleeAttack', operation: 'increment' | 'decrement') => {
    if (!currentCompanion || !currentCompanion.parsedPetCoreStats) return;
    const delta = operation === 'increment' ? 1 : -1;
    const coreStats = currentCompanion.parsedPetCoreStats;

    const settersMap = {
        hp: setCurrentPetHp,
        sanity: setCurrentPetSanity,
        mv: setCurrentPetMv,
        def: setCurrentPetDef,
    };
    const currentValuesMap = {
        hp: currentPetHp,
        sanity: currentPetSanity,
        mv: currentPetMv,
        def: currentPetDef,
    };
    const maxValuesMap = {
        hp: coreStats.maxHp,
        sanity: coreStats.maxSanity,
        mv: coreStats.mv,
        def: coreStats.def,
    };
    
    const setter = settersMap[statType as Exclude<typeof statType, 'meleeAttack'>];
    const currentValue = currentValuesMap[statType as Exclude<typeof statType, 'meleeAttack'>];
    const maxValueForStat = maxValuesMap[statType as Exclude<typeof statType, 'meleeAttack'>];


    if (setter && currentValue !== null && maxValueForStat !== undefined) {
        let newValue = currentValue + delta;
        newValue = Math.max(0, newValue); 
        newValue = Math.min(newValue, maxValueForStat);
        setter(newValue);
    }
  };

  const handleSessionMaxStatModifierChange = (statType: 'hp' | 'sanity', delta: number) => {
    if (!editableCharacterData) return;

    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newStats = { ...prevData.baseStats };
      let newModifier = 0;

      if (statType === 'hp') {
        newModifier = sessionMaxHpModifier + delta;
        setSessionMaxHpModifier(newModifier);
        const newEffectiveMaxHp = newStats.maxHp + newModifier;
        if (newEffectiveMaxHp < 1) {
            setSessionMaxHpModifier(1 - newStats.maxHp);
            newModifier = 1 - newStats.maxHp;
        }
        if (newStats.hp > (newStats.maxHp + newModifier)) {
          newStats.hp = newStats.maxHp + newModifier;
        }
      } else if (statType === 'sanity') {
        newModifier = sessionMaxSanityModifier + delta;
        setSessionMaxSanityModifier(newModifier);
        const newEffectiveMaxSanity = newStats.maxSanity + newModifier;
         if (newEffectiveMaxSanity < 1) {
            setSessionMaxSanityModifier(1 - newStats.maxSanity);
            newModifier = 1 - newStats.maxSanity;
        }
        if (newStats.sanity > (newStats.maxSanity + newModifier)) {
          newStats.sanity = newStats.maxSanity + newModifier;
        }
      }
      return { ...prevData, baseStats: newStats };
    });
  };


  const handleBuyStatPoint = (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'| 'meleeAttack'>) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) ) return;

    const config = customStatPointBuyConfig[statKey];
    const currentVal = editableCharacterData.baseStats[statKey] || 0; 
    const currentPoints = editableCharacterData.characterPoints || 0;

    if (currentVal >= config.max) {
      showToastHelper({ title: "Max Reached", description: `Maximum for ${statKey.toUpperCase()} is ${config.max}.`, variant: "destructive" });
      return;
    }
    if (currentPoints < config.cost) {
      showToastHelper({ title: "Not Enough CP", description: `Need ${config.cost} CP for +1 ${statKey.toUpperCase()}.`, variant: "destructive" });
      return;
    }

    setEditableCharacterData(prev => {
      if (!prev) return null;
      const newStats = { ...prev.baseStats };
      newStats[statKey] = (newStats[statKey] || 0) + 1; 
      if (statKey === 'hp') newStats.maxHp = (newStats.maxHp || 0) + 1;
      if (statKey === 'sanity') newStats.maxSanity = (newStats.maxSanity || 0) + 1;

      return {
        ...prev,
        baseStats: newStats,
        characterPoints: currentPoints - config.cost,
      };
    });
  };

  const handleSellStatPoint = (statKey: Exclude<StatName, 'maxHp' | 'maxSanity' | 'meleeAttack'>) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) ) return;

    const currentVal = editableCharacterData.baseStats[statKey] || 0;
     if (currentVal <= 1) { 
      showToastHelper({ title: "Min Reached", description: `${statKey.toUpperCase()} cannot go below 1.`, variant: "destructive" });
      return;
    }
    const currentPoints = editableCharacterData.characterPoints || 0;

    setEditableCharacterData(prev => {
      if (!prev) return null;
      const newStats = { ...prev.baseStats };
      const costToRefund = customStatPointBuyConfig[statKey].cost;
      newStats[statKey] = currentVal - 1;
      if (statKey === 'hp') {
        newStats.maxHp = Math.max(1, (newStats.maxHp || 1) -1); 
         if (newStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;
      }
      if (statKey === 'sanity') {
        newStats.maxSanity = Math.max(1, (newStats.maxSanity || 1) -1); 
         if (newStats.sanity > newStats.maxSanity) newStats.sanity = newStats.maxSanity;
      }

      return {
        ...prev,
        baseStats: newStats,
        characterPoints: currentPoints + costToRefund,
      };
    });
  };

  const handleIncrementCooldown = (abilityId: string) => {
    setCurrentAbilityCooldowns(prev => ({
      ...prev,
      [abilityId]: Math.min((prev[abilityId] || 0) + 1, maxAbilityCooldowns[abilityId] || Infinity),
    }));
  };

  const handleDecrementCooldown = (abilityId: string) => {
    setCurrentAbilityCooldowns(prev => ({
      ...prev,
      [abilityId]: Math.max((prev[abilityId] || 0) - 1, 0),
    }));
  };

  const handleIncrementQuantity = (abilityId: string) => {
    setCurrentAbilityQuantities(prev => ({
      ...prev,
      [abilityId]: Math.min((prev[abilityId] || 0) + 1, maxAbilityQuantities[abilityId] || Infinity),
    }));
  };

  const handleDecrementQuantity = (abilityId: string) => {
    setCurrentAbilityQuantities(prev => ({
      ...prev,
      [abilityId]: Math.max((prev[abilityId] || 0) - 1, 0),
    }));
  };

 const resetStats = () => {
    if (!editableCharacterData) return;

    const baseTemplateIdToResetTo = editableCharacterData.templateId || editableCharacterData.id || 'custom';
    const originalCharacterTemplate = charactersData.find(c => c.id === baseTemplateIdToResetTo);

    if (!originalCharacterTemplate) {
        showToastHelper({ title: "Error", description: `Could not find base template data for ID: ${baseTemplateIdToResetTo}`, variant: "destructive" });
        return;
    }

    let characterToSet: Character;
    if (baseTemplateIdToResetTo === 'custom') {
        const customDefaultTemplate = charactersData.find(c => c.id === 'custom');
        characterToSet = JSON.parse(JSON.stringify(customDefaultTemplate || initialCustomCharacterStats)); 
        characterToSet.name = customDefaultTemplate?.name || "Custom Character";
        characterToSet.baseStats = { ...(customDefaultTemplate?.baseStats || initialCustomCharacterStats) };
        characterToSet.skills = { ...(customDefaultTemplate?.skills || initialSkills) };
        characterToSet.abilities = customDefaultTemplate?.abilities ? [...customDefaultTemplate.abilities] : [];
        characterToSet.characterPoints = customDefaultTemplate?.characterPoints ?? 375;
        characterToSet.crypto = 0; 
        characterToSet.bleedPoints = 0;
        setCurrentBleedPoints(0);
        characterToSet.imageUrl = customDefaultTemplate?.imageUrl;
    } else {
        characterToSet = JSON.parse(JSON.stringify(originalCharacterTemplate));
        characterToSet.crypto = 0; 
        characterToSet.bleedPoints = 0;
        setCurrentBleedPoints(0);
    }
    
    characterToSet.id = editableCharacterData.id; 
    characterToSet.templateId = baseTemplateIdToResetTo; 
    characterToSet.selectedArsenalCardId = null;
    characterToSet.savedCooldowns = {};
    characterToSet.savedQuantities = {};
    
    setSessionMaxHpModifier(0);
    setSessionMaxSanityModifier(0);
    setEditableCharacterData(characterToSet);

    showToastHelper({ title: "Template Reset", description: `${characterToSet.name}'s sheet has been reset to its default template values.` });
};


  const handleAddAbilityToCustomCharacter = () => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) || !abilityToAddId) return;

    const abilityInfo = allUniqueAbilities.find(a => a.id === abilityToAddId);
    if (!abilityInfo) {
        showToastHelper({ title: "Error", description: "Selected ability not found.", variant: "destructive" });
        return;
    }

    if (editableCharacterData.abilities.some(a => a.id === abilityInfo.id)) {
        showToastHelper({ title: "Ability Exists", description: `${abilityInfo.name} is already added.`, variant: "destructive" });
        return;
    }

    const currentCP = editableCharacterData.characterPoints || 0;
    const abilityCost = abilityInfo.cost ?? 0; 
    const abilityNameForToast = abilityInfo.name;

    if (currentCP < abilityCost) {
        showToastHelper({ title: "Not Enough CP", description: `You need ${abilityCost} CP to add ${abilityInfo.name}. You have ${currentCP}.`, variant: "destructive" });
        return;
    }

    setEditableCharacterData(prevData => {
        if (!prevData) return null;
        const { cost, ...abilityToAddWithoutCostField } = abilityInfo;
        const newAbilities = [...prevData.abilities, abilityToAddWithoutCostField as Ability]; 
        const newCharacterPoints = currentCP - abilityCost;
        
        showToastHelper({ title: "Ability Added", description: `${abilityNameForToast} added to Custom Character for ${abilityCost} CP.` });

        return { ...prevData, abilities: newAbilities, characterPoints: newCharacterPoints };
    });
    setAbilityToAddId(undefined);
  };

  const handlePurchaseSkill = () => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) || !skillToPurchase) return;

    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentSkillLevel = currentSkills[skillToPurchase] || 0;

    if (currentSkillLevel > 0) {
      showToastHelper({ title: "Skill Already Added", description: "This skill is already part of your character. Use +/- to adjust its level.", variant: "destructive" });
      return;
    }

    const currentCP = editableCharacterData.characterPoints || 0;
    if (currentCP < SKILL_COST_LEVEL_1) {
      showToastHelper({ title: "Not Enough CP", description: `You need ${SKILL_COST_LEVEL_1} CP to add this skill.`, variant: "destructive" });
      return;
    }

    const skillDef = skillDefinitions.find(s => s.id === skillToPurchase);

    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newSkills = { ...currentSkills, [skillToPurchase!]: 1 };
      const newCharacterPoints = currentCP - SKILL_COST_LEVEL_1;
      showToastHelper({ title: "Skill Added", description: `${skillDef?.label || skillToPurchase} added at level 1.` });
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
    setSkillToPurchase(undefined);
  };

  const handleIncreaseSkillLevel = (skillId: SkillName) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_")))) return;

    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentLevel = currentSkills[skillId] || 0;
    if (currentLevel >= 3) {
      showToastHelper({ title: "Max Level Reached", description: "This skill is already at its maximum level.", variant: "destructive" });
      return;
    }

    let cost = 0;
    if (currentLevel === 0) cost = SKILL_COST_LEVEL_1;
    else if (currentLevel === 1) cost = SKILL_COST_LEVEL_2;
    else if (currentLevel === 2) cost = SKILL_COST_LEVEL_3;

    const currentCP = editableCharacterData.characterPoints || 0;
    if (currentCP < cost) {
      showToastHelper({ title: "Not Enough CP", description: `You need ${cost} CP to upgrade this skill.`, variant: "destructive" });
      return;
    }

    const skillDef = skillDefinitions.find(s => s.id === skillId);
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newSkills = { ...currentSkills, [skillId]: currentLevel + 1 };
      const newCharacterPoints = currentCP - cost;
      showToastHelper({ title: "Skill Upgraded", description: `${skillDef?.label || skillId} upgraded to level ${currentLevel + 1}.` });
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
  };

  const handleDecreaseSkillLevel = (skillId: SkillName) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_")))) return;

    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentLevel = currentSkills[skillId] || 0;
    if (currentLevel <= 1) { 
        handleRemoveSkill(skillId);
        return;
    }

    let refund = 0;
    if (currentLevel === 3) refund = SKILL_COST_LEVEL_3;
    else if (currentLevel === 2) refund = SKILL_COST_LEVEL_2;

    const skillDef = skillDefinitions.find(s => s.id === skillId);
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newSkills = { ...currentSkills, [skillId]: currentLevel - 1 };
      const newCharacterPoints = (prevData.characterPoints || 0) + refund;
      showToastHelper({ title: "Skill Downgraded", description: `${skillDef?.label || skillId} downgraded to level ${currentLevel - 1}.` });
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
  };

  const handleRemoveSkill = (skillId: SkillName) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_")))) return;

    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentLevel = currentSkills[skillId] || 0;
    if (currentLevel === 0) return;

    let totalRefund = 0;
    if (currentLevel === 1) totalRefund = SKILL_COST_LEVEL_1;
    else if (currentLevel === 2) totalRefund = SKILL_COST_LEVEL_1 + SKILL_COST_LEVEL_2;
    else if (currentLevel === 3) totalRefund = SKILL_COST_LEVEL_1 + SKILL_COST_LEVEL_2 + SKILL_COST_LEVEL_3;

    const skillDef = skillDefinitions.find(s => s.id === skillId);
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newSkills = { ...currentSkills, [skillId]: 0 };
      const newCharacterPoints = (prevData.characterPoints || 0) + totalRefund;
      showToastHelper({ title: "Skill Removed", description: `${skillDef?.label || skillId} removed. ${totalRefund} CP refunded.` });
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
  };

  const purchasedSkills = useMemo(() => {
    if (editableCharacterData && (editableCharacterData.id === 'custom' || (editableCharacterData.id && editableCharacterData.id.startsWith("custom_"))) && editableCharacterData.skills) {
      return skillDefinitions.filter(def => (editableCharacterData.skills?.[def.id as SkillName] || 0) > 0);
    }
    return [];
  }, [editableCharacterData]);

  const handleSaveCharacter = async () => {
    if (!currentUser || !auth.currentUser) {
      showToastHelper({ title: "Not Logged In", description: "You must be logged in to save a character.", variant: "destructive" });
      return;
    }
    if (!editableCharacterData) {
      showToastHelper({ title: "No Character Data", description: "No character data to save.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    if(setAuthError) setAuthError(null);
    try {
      const effectiveTemplateId = (editableCharacterData.id === 'custom' || editableCharacterData.id.startsWith("custom_"))
                                  ? 'custom'
                                  : editableCharacterData.templateId || editableCharacterData.id;
      let docIdForFirestore: string = editableCharacterData.id;

      const characterToSave: Character = {
        ...editableCharacterData,
        id: docIdForFirestore,
        templateId: effectiveTemplateId,
        crypto: editableCharacterData.crypto || 0,
        bleedPoints: currentBleedPoints,
        savedCooldowns: currentAbilityCooldowns,
        savedQuantities: currentAbilityQuantities,
        selectedArsenalCardId: editableCharacterData.selectedArsenalCardId || null,
        lastSaved: new Date().toISOString(),
      };

      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", docIdForFirestore);
      await setDoc(characterRef, characterToSave, { merge: true });
      showToastHelper({ title: "Character Saved!", description: `${characterToSave.name} has been saved successfully.` });

    } catch (error) {
      console.error("Error saving character: ", error);
      showToastHelper({ title: "Save Failed", description: "Could not save character data. Please try again.", variant: "destructive" });
      if(setAuthError && error instanceof Error) setAuthError("Failed to save character data." + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedCustomCharacter = async () => {
    if (!currentUser || !auth.currentUser) {
      showToastHelper({ title: "Not Logged In", description: "Please log in to load your saved character.", variant: "destructive" });
      return;
    }
    setIsLoadingCharacter(true);
    const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", "custom"); 
    try {
      const docSnap = await getDoc(characterRef);
      if (docSnap.exists()) {
        let loadedChar = { id: docSnap.id, ...docSnap.data() } as Character;
        loadedChar.templateId = 'custom'; 
        loadedChar.crypto = loadedChar.crypto || 0; 
        loadedChar.bleedPoints = loadedChar.bleedPoints || 0;
        setCurrentBleedPoints(loadedChar.bleedPoints);
        setEditableCharacterData(loadedChar);
        setSessionMaxHpModifier(0); 
        setSessionMaxSanityModifier(0);
        showToastHelper({ title: "Saved Custom Loaded", description: `Loaded your saved Custom Character.` });
      } else {
        const defaultCustomTemplate = charactersData.find(c => c.id === 'custom');
        if (defaultCustomTemplate) {
          let charToSet: Character = JSON.parse(JSON.stringify(defaultCustomTemplate));
          charToSet.templateId = 'custom';
          charToSet.crypto = 0;
          charToSet.bleedPoints = 0;
          setCurrentBleedPoints(0);
          setEditableCharacterData(charToSet);
          setSessionMaxHpModifier(0);
          setSessionMaxSanityModifier(0);
          showToastHelper({ title: "Default Custom Loaded", description: "No saved custom character found. Loaded default." });
        }
      }
    } catch (err) {
      console.error("Error loading saved custom character:", err);
      showToastHelper({ title: "Load Error", description: "Failed to load saved custom character.", variant: "destructive" });
    } finally {
      setIsLoadingCharacter(false);
    }
  };

  const categorizedAbilities = useMemo(() => {
    const actions: AbilityWithCost[] = [];
    const interrupts: AbilityWithCost[] = [];
    const passives: AbilityWithCost[] = [];
    const freeActions: AbilityWithCost[] = [];


    allUniqueAbilities.forEach(ability => {
      if (ability.type === 'Action') actions.push(ability);
      else if (ability.type === 'Interrupt') interrupts.push(ability);
      else if (ability.type === 'Passive') passives.push(ability);
      else if (ability.type === 'FREE Action') freeActions.push(ability);
    });

    const sortFn = (a: AbilityWithCost, b: AbilityWithCost) => a.name.localeCompare(b.name);

    return {
      actions: actions.sort(sortFn),
      interrupts: interrupts.sort(sortFn),
      passives: passives.sort(sortFn),
      freeActions: freeActions.sort(sortFn),
    };
  }, []);

  const criticalArsenalError = arsenalCards.find(card => card.id === 'error-critical-arsenal');

  const effectiveBaseStats = useMemo(() => {
    if (!editableCharacterData) return { ...initialCustomCharacterStats };
    let base = { ...editableCharacterData.baseStats };

    if (equippedArsenalCard) {
        base.hp = Math.max(0, (base.hp || 0) + (equippedArsenalCard.hpMod || 0));
        base.maxHp = Math.max(1, (base.maxHp || 0) + (equippedArsenalCard.maxHpMod || 0));
        base.mv = Math.max(0, (base.mv || 0) + (equippedArsenalCard.mvMod || 0));
        base.def = Math.max(0, (base.def || 0) + (equippedArsenalCard.defMod || 0));
        base.sanity = Math.max(0, (base.sanity || 0) + (equippedArsenalCard.sanityMod || 0));
        base.maxSanity = Math.max(1, (base.maxSanity || 0) + (equippedArsenalCard.maxSanityMod || 0));
        base.meleeAttack = Math.max(0, (base.meleeAttack || 0) + (equippedArsenalCard.meleeAttackMod || 0));
    }

    if (equippedArsenalCard && equippedArsenalCard.items) {
      equippedArsenalCard.items.forEach(item => {
        if (!item.isPet && item.category?.toUpperCase() === 'GEAR' && item.parsedStatModifiers) {
          item.parsedStatModifiers.forEach(mod => {
            const statKey = mod.targetStat as keyof CharacterStats;
            if (statKey in base && typeof (base[statKey]) === 'number') {
              (base[statKey] as number) = Math.max(
                (statKey === 'maxHp' || statKey === 'maxSanity') ? 1 : 0,
                (base[statKey] as number) + mod.value
              );
            }
          });
        }
      });
    }

    if (base.hp > base.maxHp) base.hp = base.maxHp;
    if (base.sanity > base.maxSanity) base.sanity = base.maxSanity;

    return base;
  }, [editableCharacterData, equippedArsenalCard]);

  const characterSkills = useMemo(() => {
      return editableCharacterData?.skills || initialSkills;
  }, [editableCharacterData]);

 const characterDefaultMeleeWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
    const template = charactersData.find(c => c.id === (editableCharacterData.templateId || editableCharacterData.id));
    const defaultWeapon = template?.meleeWeapon
        ? { ...template.meleeWeapon }
        : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };

    if (defaultWeapon?.name === "Fists" && defaultWeapon.attack === 1 &&
        !template?.meleeWeapon?.name &&
        editableCharacterData.templateId !== 'custom'
    ) {
        return undefined;
    }
    return defaultWeapon;
  }, [editableCharacterData]);

 const characterDefaultRangedWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
    const template = charactersData.find(c => c.id === (editableCharacterData.templateId || editableCharacterData.id));
    const defaultWeapon = template?.rangedWeapon
          ? { ...template.rangedWeapon } as RangedWeapon
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" } as RangedWeapon;

    if (defaultWeapon?.name === "None" && defaultWeapon.attack === 0 && defaultWeapon.range === 0 &&
        !template?.rangedWeapon?.name &&
        editableCharacterData.templateId !== 'custom'
    ) {
      return undefined;
    }
      return defaultWeapon;
  }, [editableCharacterData]);


  const currentMeleeWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
    let weaponToDisplay: Weapon | undefined = characterDefaultMeleeWeapon;

    if (equippedArsenalCard?.items) {
        const arsenalMeleeItem = equippedArsenalCard.items.find(item =>
           !item.isPet &&
           (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) &&
           item.parsedWeaponStats?.attack !== undefined &&
           (item.parsedWeaponStats?.range === undefined || item.parsedWeaponStats.range <= 1 || item.parsedWeaponStats.range === 0)
        );

        if (arsenalMeleeItem?.parsedWeaponStats?.attack !== undefined) {
            weaponToDisplay = {
                name: arsenalMeleeItem.abilityName || 'Arsenal Melee',
                attack: arsenalMeleeItem.parsedWeaponStats.attack,
                flavorText: arsenalMeleeItem.itemDescription || arsenalMeleeItem.parsedWeaponStats.rawDetails,
            };
        }
    }
    if (equippedArsenalCard && weaponToDisplay) { 
        weaponToDisplay = {
            ...weaponToDisplay,
            attack: (weaponToDisplay.attack || 0) + (equippedArsenalCard.meleeAttackMod || 0),
        };
    }

    const template = charactersData.find(c => c.id === (editableCharacterData.templateId || editableCharacterData.id));
    if (weaponToDisplay?.name === "Fists" && weaponToDisplay.attack === 1 &&
        !template?.meleeWeapon?.name &&
        !equippedArsenalCard?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (!i.parsedWeaponStats?.range || i.parsedWeaponStats.range <= 1)) &&
        !equippedArsenalCard?.meleeAttackMod &&
        editableCharacterData.templateId !== 'custom' 
    ) {
      return undefined;
    }
    return weaponToDisplay;
  }, [editableCharacterData, equippedArsenalCard, characterDefaultMeleeWeapon]);


  const currentRangedWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
      let weaponToDisplay: RangedWeapon | undefined = characterDefaultRangedWeapon;

      if (equippedArsenalCard?.items) {
          const arsenalRangedItem = equippedArsenalCard.items.find(item =>
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
      if (equippedArsenalCard && weaponToDisplay) { 
          weaponToDisplay = {
              ...weaponToDisplay,
              attack: (weaponToDisplay.attack || 0) + (equippedArsenalCard.rangedAttackMod || 0),
              range: (weaponToDisplay.range || 0) + (equippedArsenalCard.rangedRangeMod || 0),
          };
      }

    const template = charactersData.find(c => c.id === (editableCharacterData.templateId || editableCharacterData.id));
    if (weaponToDisplay?.name === "None" && weaponToDisplay.attack === 0 && weaponToDisplay.range === 0 &&
        !template?.rangedWeapon?.name &&
        !equippedArsenalCard?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 1)) &&
        !equippedArsenalCard?.rangedAttackMod && !equippedArsenalCard?.rangedRangeMod &&
        editableCharacterData.templateId !== 'custom' 
    ) {
      return undefined;
    }
      return weaponToDisplay;
  }, [editableCharacterData, equippedArsenalCard, characterDefaultRangedWeapon]);

  const currentCompanion = useMemo(() => {
    if (!equippedArsenalCard?.items) return null;
    return equippedArsenalCard.items.find(item => item.isPet === true) || null;
  }, [equippedArsenalCard]);

 useEffect(() => {
    if (currentCompanion && currentCompanion.parsedPetCoreStats) {
        setCurrentPetHp(currentCompanion.parsedPetCoreStats.maxHp ?? currentCompanion.parsedPetCoreStats.hp ?? null);
        setCurrentPetSanity(currentCompanion.parsedPetCoreStats.maxSanity ?? currentCompanion.parsedPetCoreStats.sanity ?? null);
        setCurrentPetMv(currentCompanion.parsedPetCoreStats.mv ?? null);
        setCurrentPetDef(currentCompanion.parsedPetCoreStats.def ?? null);
    } else {
        setCurrentPetHp(null);
        setCurrentPetSanity(null);
        setCurrentPetMv(null);
        setCurrentPetDef(null);
    }
}, [currentCompanion]);

  const getPetHpBarColorClass = () => {
    if (currentPetHp === null || !currentCompanion?.parsedPetCoreStats?.maxHp || currentCompanion.parsedPetCoreStats.maxHp <= 0) return "[&>div]:bg-gray-400";
    const percentage = (currentPetHp / currentCompanion.parsedPetCoreStats.maxHp) * 100;
    if (percentage > 66) return "[&>div]:bg-green-500";
    if (percentage > 33) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };
  const getPetSanityBarColorClass = () => {
    if (currentPetSanity === null || !currentCompanion?.parsedPetCoreStats?.maxSanity || currentCompanion.parsedPetCoreStats.maxSanity <= 0) return "[&>div]:bg-gray-400";
    const percentage = (currentPetSanity / currentCompanion.parsedPetCoreStats.maxSanity) * 100;
    if (percentage > 66) return "[&>div]:bg-blue-500";
    if (percentage > 33) return "[&>div]:bg-blue-400";
    return "[&>div]:bg-red-500";
  };
  const getPetMvBarColorClass = () => {
    if (currentPetMv === null || !currentCompanion?.parsedPetCoreStats?.mv || currentCompanion.parsedPetCoreStats.mv <= 0) return "[&>div]:bg-gray-400";
    const percentage = (currentPetMv / currentCompanion.parsedPetCoreStats.mv) * 100;
    if (percentage > 66) return "[&>div]:bg-green-500";
    if (percentage > 33) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };
  const getPetDefBarColorClass = () => {
    if (currentPetDef === null || !currentCompanion?.parsedPetCoreStats?.def || currentCompanion.parsedPetCoreStats.def <= 0) return "[&>div]:bg-gray-400";
    const percentage = (currentPetDef / currentCompanion.parsedPetCoreStats.def) * 100;
    if (percentage >= 75) return "[&>div]:bg-gray-500";
    if (percentage >= 40) return "[&>div]:bg-gray-400";
    return "[&>div]:bg-red-500";
  };

  const petMeleeWeaponForDisplay: Weapon | undefined = useMemo(() => {
    if (currentCompanion?.parsedPetCoreStats?.meleeAttack !== undefined && currentCompanion.parsedPetCoreStats.meleeAttack > 0) {
      return {
        name: currentCompanion.petName ? `${currentCompanion.petName}'s Attack` : "Natural Attack",
        attack: currentCompanion.parsedPetCoreStats.meleeAttack,
        flavorText: currentCompanion.petAbilities || "The companion's natural attack."
      };
    }
    return undefined;
  }, [currentCompanion]);


  if (authLoading || isLoadingCharacter || !editableCharacterData) {
    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl p-10 text-center">
            <CardHeader>
                <CardTitle className="text-3xl">Loading Character Data...</CardTitle>
                <CardDescription>Please wait a moment.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

 return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {editableCharacterData.imageUrl && (
        <Image
          src={editableCharacterData.imageUrl}
          alt={`${editableCharacterData.name} background`}
          fill
          style={{ objectFit: 'contain', objectPosition: 'center top' }}
          className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none"
          priority
          data-ai-hint={
             editableCharacterData.name === "Fei" ? "male hunter anime" :
             editableCharacterData.name === "Michael" ? "male soldier urban" :
             editableCharacterData.name === "Custom Character" ? "silhouette mysterious" :
             editableCharacterData.name === "Tamara" ? "female adventurer jungle" :
             editableCharacterData.name === "Trish" ? "female warrior katana" :
             editableCharacterData.name === "Blake" ? "male hunter bandana" :
             editableCharacterData.name === "Walter" ? "male hunter leather jacket" :
             "character background"
          }
        />
      )}
      <div className="relative z-10 bg-transparent">
         <CharacterHeader
            selectedCharacterId={selectedCharacterId}
            editableCharacterData={editableCharacterData}
            characterDropdownOptions={characterDropdownOptions}
            rawArsenalCards={arsenalCards}
            currentUser={currentUser}
            isLoadingCharacter={isLoadingCharacter}
            onCharacterDropdownChange={handleCharacterDropdownChange}
            onCustomCharacterNameChange={handleCustomCharacterNameChange}
            onLoadSavedCustomCharacter={handleLoadSavedCustomCharacter}
            onResetStats={resetStats}
        />
        <CardContent className="space-y-6">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 p-1 h-auto">
              <TabsTrigger value="stats" className="px-2 py-2 text-xs sm:text-sm md:px-3 md:py-1.5 whitespace-normal text-center h-auto">Stats &amp; Equipment</TabsTrigger>
              <TabsTrigger value="abilities" className="px-2 py-2 text-xs sm:text-sm md:px-3 md:py-1.5 whitespace-normal text-center h-auto">Abilities</TabsTrigger>
              <TabsTrigger value="arsenal" className="px-2 py-2 text-xs sm:text-sm md:px-3 md:py-1.5 whitespace-normal text-center h-auto">Arsenal</TabsTrigger>
              <TabsTrigger value="skills" className="px-2 py-2 text-xs sm:text-sm md:px-3 md:py-1.5 whitespace-normal text-center h-auto">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-6 space-y-6">
              <CoreStatsSection
                editableCharacterData={editableCharacterData}
                effectiveBaseStats={effectiveBaseStats}
                highlightedStat={highlightedStat}
                handleStatChange={handleStatChange}
                incrementStat={incrementStat}
                decrementStat={decrementStat}
                currentBleedPoints={currentBleedPoints}
                handleBleedPointsChange={handleBleedPointsChange}
                incrementBleedPoints={incrementBleedPoints}
                decrementBleedPoints={decrementBleedPoints}
                handleBuyStatPoint={handleBuyStatPoint}
                handleSellStatPoint={handleSellStatPoint}
                customStatPointBuyConfig={customStatPointBuyConfig}
                sessionMaxHpModifier={sessionMaxHpModifier}
                sessionMaxSanityModifier={sessionMaxSanityModifier}
                handleSessionMaxStatModifierChange={handleSessionMaxStatModifierChange}
              />
              <Separator/>
                <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="crypto" className="flex items-center text-lg font-medium">
                            <Coins className="mr-2 h-6 w-6 text-yellow-400" />
                            Crypto
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={decrementCrypto} className="h-8 w-8">
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                id="crypto"
                                type="number"
                                value={editableCharacterData.crypto || 0}
                                onChange={(e) => handleCryptoChange(e.target.value)}
                                className="w-24 h-8 text-center text-lg font-bold"
                                min="0"
                            />
                            <Button variant="outline" size="icon" onClick={incrementCrypto} className="h-8 w-8">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Your character's current Crypto balance.</p>
                </div>
              <Separator/>
              <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center"><Swords className="mr-2 h-6 w-6 text-primary" /> Weapons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentMeleeWeapon && <WeaponDisplay weapon={currentMeleeWeapon} type="melee" equippedArsenalCard={equippedArsenalCard} baseMeleeWeaponName={editableCharacterData.meleeWeapon?.name} isArsenalWeapon={!!(equippedArsenalCard?.items.find(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (!i.parsedWeaponStats?.range || i.parsedWeaponStats.range <= 1)))} />}
                      {currentRangedWeapon && <WeaponDisplay weapon={currentRangedWeapon} type="ranged" equippedArsenalCard={equippedArsenalCard} baseRangedWeaponName={editableCharacterData.rangedWeapon?.name} isArsenalWeapon={!!(equippedArsenalCard?.items.find(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 1)))}/>}
                  </div>
              </div>

            {equippedArsenalCard && (
              <>
                <Separator className="my-6" />
                <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
                    <h3 className="text-lg font-semibold mb-1 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-accent" /> Equipped Arsenal: {equippedArsenalCard.name}
                    </h3>
                    {equippedArsenalCard.description && <p className="text-xs text-muted-foreground mb-2">{equippedArsenalCard.description}</p>}
                    {(equippedArsenalCard.imageUrlFront || equippedArsenalCard.imageUrlBack) && (
                    <div className="my-3 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-2">
                        {equippedArsenalCard.imageUrlFront && (
                        <div className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30">
                            <Image src={equippedArsenalCard.imageUrlFront} alt={`${equippedArsenalCard.name} - Front`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card front" />
                        </div>
                        )}
                        {equippedArsenalCard.imageUrlBack && (
                        <div className="relative w-full sm:w-1/2 md:w-2/5 aspect-[63/88] overflow-hidden rounded-md border border-muted-foreground/30">
                            <Image src={equippedArsenalCard.imageUrlBack} alt={`${equippedArsenalCard.name} - Back`} fill style={{ objectFit: 'contain' }} data-ai-hint="arsenal card back" />
                        </div>
                        )}
                    </div>
                    )}
                </div>
              </>
            )}


              {currentCompanion && (
                <>
                  <Separator />
                   <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                      <PawPrint className="mr-2 h-6 w-6 text-primary" /> Equipped Companion: {currentCompanion.petName || 'Unnamed Companion'}
                    </h3>
                    {currentCompanion.itemDescription && <p className="text-xs text-muted-foreground mb-2">{currentCompanion.itemDescription}</p>}
                    {currentCompanion.petStats && <p className="text-xs text-muted-foreground mb-2">Raw Stats: {currentCompanion.petStats}</p>}


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-3">
                      {currentCompanion.parsedPetCoreStats?.maxHp !== undefined && currentPetHp !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Heart className="mr-2 h-4 w-4 text-red-500" /> HP
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('hp', 'decrement')} className="h-6 w-6">
                                 <UserMinus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={currentPetHp} readOnly className="w-12 h-6 text-center text-sm font-bold p-1"/>
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('hp', 'increment')} className="h-6 w-6">
                                 <UserPlus className="h-3 w-3" />
                              </Button>
                            </div>
                         </div>
                          <Progress value={(currentPetHp / (currentCompanion.parsedPetCoreStats.maxHp || 1)) * 100} className={cn("h-1.5", getPetHpBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetHp} / {currentCompanion.parsedPetCoreStats.maxHp}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats?.maxSanity !== undefined && currentPetSanity !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Brain className="mr-2 h-4 w-4 text-blue-400" /> Sanity
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('sanity', 'decrement')} className="h-6 w-6">
                                 <UserMinus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={currentPetSanity} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('sanity', 'increment')} className="h-6 w-6">
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetSanity / (currentCompanion.parsedPetCoreStats.maxSanity || 1)) * 100} className={cn("h-1.5", getPetSanityBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetSanity} / {currentCompanion.parsedPetCoreStats.maxSanity}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats?.mv !== undefined && currentPetMv !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Footprints className="mr-2 h-4 w-4 text-green-500" /> MV
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('mv', 'decrement')} className="h-6 w-6">
                                 <UserMinus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={currentPetMv} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('mv', 'increment')} className="h-6 w-6">
                                 <UserPlus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetMv / (currentCompanion.parsedPetCoreStats.mv || 1)) * 100} className={cn("h-1.5", getPetMvBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetMv} / {currentCompanion.parsedPetCoreStats.mv}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats?.def !== undefined && currentPetDef !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Shield className="mr-2 h-4 w-4 text-gray-400" /> DEF
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('def', 'decrement')} className="h-6 w-6">
                                <UserMinus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={currentPetDef} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('def', 'increment')} className="h-6 w-6">
                                 <UserPlus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetDef / (currentCompanion.parsedPetCoreStats.def || 1)) * 100} className={cn("h-1.5", getPetDefBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetDef} / {currentCompanion.parsedPetCoreStats.def}</p>
                        </div>
                      )}
                      {petMeleeWeaponForDisplay && (
                        <div className="md:col-span-2">
                          <WeaponDisplay weapon={petMeleeWeaponForDisplay} type="melee" isArsenalWeapon={false} />
                        </div>
                      )}
                    </div>
                     {currentCompanion.petAbilities && (
                      <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-muted-foreground/20">
                        <strong className="text-foreground">Abilities:</strong> {currentCompanion.petAbilities}
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="abilities" className="mt-6">
               <AbilitiesSection
                editableCharacterData={editableCharacterData}
                allUniqueAbilities={allUniqueAbilities}
                categorizedAbilities={categorizedAbilities}
                abilityToAddId={abilityToAddId}
                setAbilityToAddId={setAbilityToAddId}
                handleAddAbilityToCustomCharacter={handleAddAbilityToCustomCharacter}
                currentAbilityCooldowns={currentAbilityCooldowns}
                maxAbilityCooldowns={maxAbilityCooldowns}
                handleIncrementCooldown={handleIncrementCooldown}
                handleDecrementCooldown={handleDecrementCooldown}
                currentAbilityQuantities={currentAbilityQuantities}
                maxAbilityQuantities={maxAbilityQuantities}
                handleIncrementQuantity={handleIncrementQuantity}
                handleDecrementQuantity={handleDecrementQuantity}
              />
            </TabsContent>

            <TabsContent value="arsenal" className="mt-6 space-y-6">
                <ArsenalTabContent
                    editableCharacterData={editableCharacterData}
                    arsenalCards={arsenalCards}
                    equippedArsenalCard={equippedArsenalCard}
                    handleArsenalCardChange={handleArsenalCardChange}
                    currentCompanion={currentCompanion}
                    criticalArsenalError={criticalArsenalError}
                    currentPetHp={currentPetHp} 
                    currentPetSanity={currentPetSanity} 
                    handleIncrementPetStat={(statType: 'hp' | 'sanity' | 'mv' | 'def') => handlePetStatChange(statType, 'increment')}
                    handleDecrementPetStat={(statType: 'hp' | 'sanity' | 'mv' | 'def') => handlePetStatChange(statType, 'decrement')}
                />
            </TabsContent>

            <TabsContent value="skills" className="mt-6 space-y-6">
              <SkillsSection
                editableCharacterData={editableCharacterData}
                characterSkills={characterSkills}
                skillDefinitions={skillDefinitions}
                skillToPurchase={skillToPurchase}
                setSkillToPurchase={setSkillToPurchase}
                handlePurchaseSkill={handlePurchaseSkill}
                handleIncreaseSkillLevel={handleIncreaseSkillLevel}
                handleDecreaseSkillLevel={handleDecreaseSkillLevel}
                handleRemoveSkill={handleRemoveSkill}
                purchasedSkills={purchasedSkills}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end pt-6 z-10">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSaveCharacter}
            disabled={!currentUser || !editableCharacterData || authLoading || isSaving}
          >
            <Save className="mr-2 h-5 w-5" />
            {isSaving ? "Saving..." : "Save Character"}
          </Button>
        </CardFooter>
        </div>
      </Card>
  );
}

    