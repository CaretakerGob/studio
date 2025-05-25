
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardTitle, CardDescription, CardFooter, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Save, Swords, Library, PawPrint,
  Heart, Shield, Footprints, Brain, Laptop, Star, VenetianMask, Sparkles,
  HeartHandshake, Wrench, Search, BookMarked, Smile, Leaf, ClipboardList, SlidersHorizontal, PersonStanding,
  Shirt, UserCog, Eye, Copy, Trash2, Edit3, Star as StarIcon
} from "lucide-react";
import type { CharacterStats, StatName, Character, Ability, AbilityType, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition } from '@/types/character';
import type { ArsenalCard, ArsenalItem } from '@/types/arsenal';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';


import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/context/auth-context";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

import { CharacterHeader } from './character-header';
import { CoreStatsSection, customStatPointBuyConfig } from './core-stats-section';
import { WeaponDisplay } from './weapon-display';
import { SkillsSection } from './skills-section';
import { AbilitiesSection } from './abilities-section';
import { ArsenalTabContent } from './arsenal-tab-content';


const initialBaseStats: CharacterStats = {
  hp: 1, maxHp: 1,
  mv: 1,
  def: 1,
  sanity: 1, maxSanity: 1,
  meleeAttack: 0,
};

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

const skillDefinitions: SkillDefinition[] = [
  { id: 'ath', label: "Athletics (ATH)", description: "Prowess at swimming, running, tumbling, and parkour.", icon: PersonStanding },
  { id: 'cpu', label: "Computer Use (CPU)", description: "Adept at hacking, online research, and navigating networks.", icon: Laptop },
  { id: 'dare', label: "Dare Devil (DARE)", description: "Fearless and skilled driver/pilot, performs spectacular stunts.", icon: Star },
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
    avatarSeed: 'customcharacter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FCustom%20Character%20silhouette.png?alt=media&token=2b64a81c-42cf-4f1f-82ac-01b9ceae863b',
    meleeWeapon: { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" },
    rangedWeapon: { name: "Thrown Rock", attack: 1, range: 3, flavorText: "A hastily thrown rock" },
    characterPoints: 375,
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'gob',
    name: 'Gob',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, tac: 3, sur: 2, kno: 3 },
    avatarSeed: 'gob',
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FGob.png?alt=media&token=d5d63a0b-0465-4c50-a179-351ac7cc7fa9`,
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    baseStats: { hp: 6, maxHp: 6, mv: 4, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, occ: 2, emp: 2, tun: 1 },
    avatarSeed: 'cassandra',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FCassandra.png?alt=media&token=6df9b49f-aeb0-45a1-ae75-7f77945ce18c',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'fei',
    name: 'Fei',
    baseStats: { hp: 5, maxHp: 5, mv: 4, def: 2, sanity: 6, maxSanity: 6, meleeAttack: 0 },
    skills: { ...initialSkills, occ: 4, emp: 2, kno: 2 },
    avatarSeed: 'fei',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2Ffei.png?alt=media&token=ec84180b-3734-499e-9767-0846580cdce9',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'michael',
    name: 'Michael',
    baseStats: { hp: 6, maxHp: 6, mv: 5, def: 3, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, emp: 2, dec: 2, inv: 2, ath: 2 },
    avatarSeed: 'michael',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FMichael.png?alt=media&token=4674d3b6-5f0e-494c-97cb-b768b84f17fe',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'tamara',
    name: 'Tamara',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 4, sanity: 6, maxSanity: 6, meleeAttack: 0 },
    skills: { ...initialSkills, emp: 4, pers: 2 },
    avatarSeed: 'tamara',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FEnhanced%20Tamara%20new.png?alt=media&token=f3408528-8abe-4ed5-b518-47e375ca09fb',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'trish',
    name: 'Trish',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 3, sanity: 4, maxSanity: 4, meleeAttack: 0 },
    skills: { ...initialSkills, ath: 3, pers: 2 },
    avatarSeed: 'trish',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FTrish%20Black%20Shoes.png?alt=media&token=6bb82bb4-c06f-40b1-bd55-5c86a78cedb5',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'blake',
    name: 'Blake',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, eng: 2, sur: 2, tac: 2 },
    avatarSeed: 'blake',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FBlake%202.png?alt=media&token=6992782d-124a-44ff-8eec-be9cfd0221f2',
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
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
  },
  {
    id: 'walter',
    name: 'Walter',
    baseStats: { hp: 9, maxHp: 9, mv: 4, def: 4, sanity: 5, maxSanity: 5, meleeAttack: 0 },
    skills: { ...initialSkills, dare: 2, cpu: 2, pers: 2 },
    avatarSeed: 'walter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FWalter.png?alt=media&token=0f5ccd9d-7f35-4400-b9a4-c5d4f5e051e7',
    meleeWeapon: { name: "Mace", attack: 3 },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" },
    abilities: [
      { id: 'walter_wild_swing', name: 'Wild Swing', type: 'Action', details: 'A4/R1- CLEAVE', description: 'CLEAVE. 1 round CD.', cooldown: '1 round CD', cost: 50},
      { id: 'walter_swap_out', name: 'Swap Out', type: 'Action', description: 'Walter swaps between Arsenals.', cost: 50},
      { id: 'walter_blow_for_blow', name: 'Blow for Blow', type: 'Interrupt', details: 'R1', description: 'Walter Lowers the targets Defense by 1 for 1 round. 2 round CD.', cooldown: '2 round CD', cost: 50},
      { id: 'walter_intervene_x4', name: 'Intervene x4', type: 'Interrupt', details: 'R4', description: 'Walter takes space of another unit within range. Unit is moved to an adjacent open space.', maxQuantity: 4, cost: 50},
      { id: 'walter_parry', name: 'Parry', type: 'Passive', description: 'Double Swords count as a block. Does not count for Perfect Defense. Allies adjacent to Walter also benefit from Parry.', cost: 50},
      { id: 'walter_load_out', name: 'Load Out', type: 'Passive', description: 'Walter can store 1 backup Arsenal that must be picked at the start of the Investigation.', cost: 50},
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
    savedCooldowns: {},
    savedQuantities: {},
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
  arsenalCards: ArsenalCard[];
}

export function CharacterSheetUI({ arsenalCards: rawArsenalCards }: CharacterSheetUIProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [editableCharacterData, setEditableCharacterData] = useState<Character | null>(null);
  const [userSavedCharacters, setUserSavedCharacters] = useState<Character[]>([]);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  const [abilityToAddId, setAbilityToAddId] = useState<string | undefined>(undefined);
  const [skillToPurchase, setSkillToPurchase] = useState<SkillName | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);
  const [initialIdProcessed, setInitialIdProcessed] = useState(false);


  const [currentPetHp, setCurrentPetHp] = useState<number | null>(null);
  const [currentPetSanity, setCurrentPetSanity] = useState<number | null>(null);
  const [currentPetMv, setCurrentPetMv] = useState<number | null>(null);
  const [currentPetDef, setCurrentPetDef] = useState<number | null>(null);


  const { toast } = useToast();
  const { currentUser, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
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

  const arsenalCards = useMemo(() => {
    if (!rawArsenalCards) return [];
    return rawArsenalCards.filter(card => !(card.id.startsWith('error-') || card.id.startsWith('warning-')));
  }, [rawArsenalCards]);

  // Effect for determining INITIAL character ID based on query param or user default
  useEffect(() => {
    if (authLoading) {
      setIsLoadingCharacter(true);
      return;
    }

    if (!initialIdProcessed) {
      setIsLoadingCharacter(true);
      const loadParam = searchParams.get('load');

      if (loadParam) {
        setSelectedCharacterId(loadParam);
        const newUrl = typeof window !== "undefined" ? new URL(window.location.href) : null;
        if (newUrl) {
          newUrl.searchParams.delete('load');
          router.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
         setInitialIdProcessed(true); // Mark as processed once loadParam is handled
      } else if (currentUser && auth.currentUser) {
        const prefsDocRef = doc(db, "userCharacters", currentUser.uid, "preferences", "userPrefs");
        getDoc(prefsDocRef).then(docSnap => {
          let newSelectedId = charactersData[0].id; // Default to first template
          if (docSnap.exists()) {
            const userDefaultId = docSnap.data()?.defaultCharacterId;
            if (userDefaultId && (charactersData.some(c => c.id === userDefaultId) || userSavedCharacters.some(c => c.id === userDefaultId))) {
              newSelectedId = userDefaultId;
            }
          }
          setSelectedCharacterId(newSelectedId);
        }).catch(err => {
          console.error("Error fetching default character preference:", err);
          setSelectedCharacterId(charactersData[0].id); // Fallback to first template
        }).finally(() => {
           setInitialIdProcessed(true);
        });
      } else {
        setSelectedCharacterId(charactersData[0].id); // Fallback for no user
        setInitialIdProcessed(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUser, authLoading, router]);


  // Effect for loading actual character data once selectedCharacterId is determined OR current user changes
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!selectedCharacterId || !initialIdProcessed) {
         if (!initialIdProcessed && !authLoading) setIsLoadingCharacter(false);
        return;
      }

      setIsLoadingCharacter(true);
      if (setAuthError) setAuthError(null);

      let characterToLoad: Character | undefined | null = undefined;
      const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);
      
      if (selectedCharacterId === 'custom' && !currentUser) {
          characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
          if (characterToLoad) {
            characterToLoad.templateId = 'custom';
          }
      } else if (selectedCharacterId === 'custom' && currentUser) {
          // For 'custom', initially load the default template. User must click "Load My Saved Custom"
          characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
          if (characterToLoad) {
            characterToLoad.templateId = 'custom';
            characterToLoad.name = defaultTemplate?.name || 'Custom Character'; // Ensure default name
          }
          showToastHelper({ title: "Template Loaded", description: "Loaded default Custom Character template. Use 'Load My Saved Custom' for your version."});

      } else if (currentUser && auth.currentUser) {
        const firestoreDocIdToLoad = selectedCharacterId;
        const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", firestoreDocIdToLoad);

        try {
            const docSnap = await getDoc(characterRef);
            if (docSnap.exists()) {
                characterToLoad = { id: docSnap.id, ...docSnap.data() } as Character;
                if (!characterToLoad.templateId) { // Ensure templateId is set for older saved data
                    characterToLoad.templateId = charactersData.some(c => c.id === docSnap.id) ? docSnap.id : 'custom';
                }
                 showToastHelper({ title: "Saved Character Loaded", description: `Loaded your saved version of ${characterToLoad.name || characterToLoad.id}.` });
            } else {
                // If not saved, load default template
                characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
                if (characterToLoad) characterToLoad.templateId = selectedCharacterId; // Set templateId
                showToastHelper({ title: "Default Loaded", description: `Loaded default template for ${defaultTemplate?.name || selectedCharacterId}. No saved version found.` });
            }
        } catch (err: any) {
            console.error("Error loading character from Firestore:", err);
            characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
            if (characterToLoad) characterToLoad.templateId = selectedCharacterId;
            showToastHelper({ title: "Load Failed", description: "Could not load saved data. Loading default.", variant: "destructive" });
        }
      } else {
        // No user logged in, load default template for non-custom characters
        characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : null;
        if (characterToLoad) characterToLoad.templateId = selectedCharacterId;
      }

      if (characterToLoad) {
        // Ensure core stats and skills are properly initialized if missing from loaded data
        const baseTemplateForStats = charactersData.find(c => c.id === (characterToLoad?.templateId || characterToLoad?.id));
        characterToLoad.baseStats = { ...(baseTemplateForStats?.baseStats || initialBaseStats) , ...characterToLoad.baseStats };
        characterToLoad.skills = { ...(baseTemplateForStats?.skills || initialSkills) , ...characterToLoad.skills };
        characterToLoad.abilities = Array.isArray(characterToLoad.abilities) ? characterToLoad.abilities : (baseTemplateForStats?.abilities || []);
        characterToLoad.savedCooldowns = characterToLoad.savedCooldowns || {};
        characterToLoad.savedQuantities = characterToLoad.savedQuantities || {};

        setEditableCharacterData(characterToLoad);
      } else if (defaultTemplate && !characterToLoad){ 
        // This case handles if defaultTemplate exists but characterToLoad somehow didn't get set (should be rare)
        let fallbackChar: Character = JSON.parse(JSON.stringify(defaultTemplate));
        fallbackChar.templateId = selectedCharacterId;
        setEditableCharacterData(fallbackChar);
        showToastHelper({ title: "Fallback Loaded", description: "Loaded default template due to an unexpected issue.", variant: "destructive" });
      } else {
        // This case is if defaultTemplate itself is not found (e.g., bad selectedCharacterId)
        setEditableCharacterData(null); 
        showToastHelper({ title: "Error", description: `Template for ID "${selectedCharacterId}" not found. Cannot load character.`, variant: "destructive" });
      }
      setAbilityToAddId(undefined);
      setSkillToPurchase(undefined);
      setIsLoadingCharacter(false);
    };

    if (initialIdProcessed) { 
      loadCharacterData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterId, currentUser, initialIdProcessed, setAuthError, showToastHelper, parseCooldownRounds]);


  const equippedArsenalCard = useMemo(() => {
    if (!editableCharacterData?.selectedArsenalCardId || !arsenalCards) {
      return null;
    }
    const card = arsenalCards.find(card => card.id === editableCharacterData.selectedArsenalCardId) || null;
    if (card?.id?.startsWith('error-') || card?.id?.startsWith('warning-')) return null;
    return card;
  }, [editableCharacterData?.selectedArsenalCardId, arsenalCards]);


  const effectiveAbilities = useMemo(() => {
    let baseAbilities = editableCharacterData?.abilities ? [...editableCharacterData.abilities] : [];
    const arsenalGrantedAbilities: Ability[] = [];

    if (equippedArsenalCard && equippedArsenalCard.items) {
        equippedArsenalCard.items.forEach(item => {
            const createAbilityFromItem = (type: AbilityType) => ({
                id: `arsenal-${equippedArsenalCard.id}-${item.id}-${type.replace(/\s+/g, '')}`,
                name: item.abilityName || `Arsenal ${type}`,
                type: type,
                description: item.itemDescription || item.effect || `Granted by ${item.abilityName || 'equipped arsenal'}.`,
                cooldown: item.cd,
                maxQuantity: item.qty,
                details: item.class || item.type,
                cost: 0, // Arsenal abilities are not purchased
            });

            if (item.isAction) arsenalGrantedAbilities.push(createAbilityFromItem('Action'));
            if (item.isInterrupt) arsenalGrantedAbilities.push(createAbilityFromItem('Interrupt'));
            if (item.isPassive) arsenalGrantedAbilities.push(createAbilityFromItem('Passive'));
            if (item.isFreeAction) arsenalGrantedAbilities.push(createAbilityFromItem('FREE Action'));
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
            // Only restore saved cooldowns for base character abilities, not arsenal-granted ones (unless we decide to save arsenal ability states too)
            if (editableCharacterData.abilities.find(ba => ba.id === ability.id) && savedCDs[ability.id] !== undefined) {
              newInitialCurrentCDs[ability.id] = savedCDs[ability.id];
            } else {
              newInitialCurrentCDs[ability.id] = maxRounds; 
            }
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt' || ability.type === 'FREE Action')) {
          newMaxQTs[ability.id] = ability.maxQuantity;
           // Only restore saved quantities for base character abilities
           if (editableCharacterData.abilities.find(ba => ba.id === ability.id) && savedQTs[ability.id] !== undefined) {
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
      editableCharacterData?.abilities 
    ]);

  useEffect(() => {
    const fetchUserSavedCharacters = async () => {
      if (currentUser && auth.currentUser) {
        try {
          const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
          const querySnapshot = await getDocs(charactersCollectionRef);
          const savedChars = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data() as Omit<Character, 'id'> & { templateId?: string };
            return {
              ...data,
              id: docSnap.id,
              templateId: data.templateId || (docSnap.id === 'custom' ? 'custom' : docSnap.id), // Ensure templateId
            };
          });
          setUserSavedCharacters(savedChars);
        } catch (err) {
          console.error("Error fetching user's saved characters:", err);
          showToastHelper({ title: "Load Error", description: "Could not fetch list of saved characters.", variant: "destructive"});
          setUserSavedCharacters([]);
        }
      } else {
        setUserSavedCharacters([]);
      }
    };
    fetchUserSavedCharacters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isSaving]); // Re-fetch when user changes or after a save action


  const characterDropdownOptions = useMemo(() => {
    const optionsMap = new Map<string, { id: string; name: string; displayNameInDropdown: string; isSaved: boolean }>();

    // Add default templates first
    charactersData.forEach(templateChar => {
      optionsMap.set(templateChar.id, {
        id: templateChar.id,
        name: templateChar.name,
        displayNameInDropdown: templateChar.name, // Base display name
        isSaved: false, // Assume not saved by default for templates
      });
    });

    // Overlay or add saved character information
    userSavedCharacters.forEach(savedChar => {
      const templateIdForSavedChar = savedChar.templateId || (charactersData.some(c => c.id === savedChar.id) ? savedChar.id : 'custom');
      const baseTemplate = charactersData.find(c => c.id === templateIdForSavedChar);
      let optionName = savedChar.name || baseTemplate?.name || savedChar.id;
      let displayNameInDropdown;
      const defaultCustomName = charactersData.find(c => c.id === 'custom')?.name || 'Custom Character';


      if (templateIdForSavedChar === 'custom') {
        if (savedChar.name && savedChar.name !== defaultCustomName) {
          displayNameInDropdown = `${savedChar.name} (Custom Character)`;
        } else {
          // If savedChar.id is 'custom' and name is default, it's a saved default custom
          displayNameInDropdown = `${defaultCustomName} (Saved)`;
        }
        optionName = savedChar.name || defaultCustomName;
      } else if (baseTemplate) {
        if (savedChar.name && savedChar.name !== baseTemplate.name) {
          displayNameInDropdown = `${savedChar.name} (${baseTemplate.name})`;
        } else {
          displayNameInDropdown = `${baseTemplate.name} (Saved)`;
        }
        optionName = savedChar.name || baseTemplate.name;
      } else { // Should not happen if templateId is always set, but as fallback
        displayNameInDropdown = `${savedChar.name || savedChar.id} (Saved Document)`;
        optionName = savedChar.name || savedChar.id;
      }
      
      optionsMap.set(savedChar.id, { // Use savedChar.id as key for user's specific saved instances
        id: savedChar.id, 
        name: optionName,
        displayNameInDropdown: displayNameInDropdown,
        isSaved: true,
      });
    });
    
    // If editableCharacterData is loaded and its name was reset, update the dropdown display for that ID
   if (editableCharacterData && editableCharacterData.id && optionsMap.has(editableCharacterData.id)) {
        const currentOptionToUpdate = optionsMap.get(editableCharacterData.id)!;
        const baseTemplateForCurrent = charactersData.find(c => c.id === (editableCharacterData.templateId || editableCharacterData.id));
        const defaultCustomName = charactersData.find(c => c.id === 'custom')?.name || "Custom Character";

        if (editableCharacterData.templateId === 'custom') {
            // If current editable is the custom template and its name matches the default, just show the default name
            if (editableCharacterData.name === defaultCustomName && currentOptionToUpdate.isSaved) {
                 currentOptionToUpdate.displayNameInDropdown = `${defaultCustomName} (Saved)`;
            } else if (editableCharacterData.name && editableCharacterData.name !== defaultCustomName) {
                 currentOptionToUpdate.displayNameInDropdown = `${editableCharacterData.name} (Custom Character)`;
            }
             else { // Default template, not saved or name matches default
                 currentOptionToUpdate.displayNameInDropdown = editableCharacterData.name || defaultCustomName;
            }
        } else if (baseTemplateForCurrent) {
             // If current editable name is the base template name (e.g., after reset) AND it was saved, don't show (Saved)
            if (editableCharacterData.name === baseTemplateForCurrent.name && !currentOptionToUpdate.isSaved) {
                currentOptionToUpdate.displayNameInDropdown = baseTemplateForCurrent.name;
            } else if (editableCharacterData.name === baseTemplateForCurrent.name && currentOptionToUpdate.isSaved) {
                currentOptionToUpdate.displayNameInDropdown = `${baseTemplateForCurrent.name} (Saved)`;
            }
            else if (editableCharacterData.name && editableCharacterData.name !== baseTemplateForCurrent.name) {
                currentOptionToUpdate.displayNameInDropdown = `${editableCharacterData.name} (${baseTemplateForCurrent.name})`;
            } else { // Default template view
                 currentOptionToUpdate.displayNameInDropdown = editableCharacterData.name || baseTemplateForCurrent.name;
            }
        }
        optionsMap.set(editableCharacterData.id, currentOptionToUpdate);
    }
    
    return Array.from(optionsMap.values()).sort((a, b) => a.displayNameInDropdown.localeCompare(b.displayNameInDropdown));
  }, [userSavedCharacters, editableCharacterData?.id, editableCharacterData?.name, editableCharacterData?.templateId]);


  // id here is the actual character ID (templateId like 'gob', 'custom', or a specific saved ID like 'custom_timestamp')
  const handleCharacterDropdownChange = (id: string) => {
    setSelectedCharacterId(id);
  };


  const handleCustomCharacterNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (editableCharacterData?.templateId === 'custom' || editableCharacterData?.id === 'custom' || editableCharacterData?.id.startsWith("custom_")) {
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
     if (!editableCharacterData || editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) return;
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newStats = { ...prevData.baseStats, [statName]: numericValue };
      if (statName === 'hp') newStats.hp = Math.max(0, Math.min(numericValue, newStats.maxHp));
      if (statName === 'maxHp') newStats.maxHp = Math.max(1, numericValue);
      if (statName === 'sanity') newStats.sanity = Math.max(0, Math.min(numericValue, newStats.maxSanity));
      if (statName === 'maxSanity') newStats.maxSanity = Math.max(1, numericValue);

      if(statName === 'maxHp' && newStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;
      if(statName === 'maxSanity' && newStats.sanity > newStats.maxSanity) newStats.sanity = newStats.maxSanity;

      return { ...prevData, baseStats: newStats };
    });

    setHighlightedStat(statName);
    setTimeout(() => setHighlightedStat(null), 300);
  };

  const incrementStat = (statName: StatName) => {
     if (!editableCharacterData || editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) return;
     const currentStats = editableCharacterData.baseStats;
     if (statName === 'hp' && currentStats.hp >= currentStats.maxHp) return;
     if (statName === 'sanity' && currentStats.sanity >= currentStats.maxSanity) return;
    handleStatChange(statName, (currentStats[statName] || 0) + 1);
  };

  const decrementStat = (statName: StatName) => {
    if (!editableCharacterData || editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) return;
    handleStatChange(statName, (editableCharacterData.baseStats[statName] || 0) - 1);
  };

  const handlePetStatChange = (statType: 'hp' | 'sanity' | 'mv' | 'def', operation: 'increment' | 'decrement') => {
    if (!currentCompanion || !currentCompanion.parsedPetCoreStats) return;
    const delta = operation === 'increment' ? 1 : -1;
    const coreStats = currentCompanion.parsedPetCoreStats;

    let setter: React.Dispatch<React.SetStateAction<number | null>> | null = null;
    let currentValue: number | null = null;
    let maxValue: number | undefined = undefined;
    let baseValue: number | undefined = undefined; 

    switch (statType) {
        case 'hp':
            setter = setCurrentPetHp;
            currentValue = currentPetHp;
            maxValue = coreStats.maxHp;
            break;
        case 'sanity':
            setter = setCurrentPetSanity;
            currentValue = currentPetSanity;
            maxValue = coreStats.maxSanity;
            break;
        case 'mv':
            setter = setCurrentPetMv;
            currentValue = currentPetMv;
            baseValue = coreStats.mv; 
            maxValue = baseValue; 
            break;
        case 'def':
            setter = setCurrentPetDef;
            currentValue = currentPetDef;
            baseValue = coreStats.def; 
            maxValue = baseValue;
            break;
        default:
            return;
    }

    if (setter && currentValue !== null) {
        let newValue = currentValue + delta;
        newValue = Math.max(0, newValue); 

        if (maxValue !== undefined) {
          newValue = Math.min(newValue, maxValue); 
        }
        
        setter(newValue);
    }
  };


  const handleBuyStatPoint = (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'| 'meleeAttack'>) => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) ) return;

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
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) ) return;

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
      if (statKey === 'hp') newStats.maxHp = Math.max(1, (newStats.maxHp || 1) -1); 
      if (statKey === 'sanity') newStats.maxSanity = Math.max(1, (newStats.maxSanity || 1) -1); 


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

    const templateIdToResetTo = editableCharacterData.templateId || selectedCharacterId || 'custom';
    const originalCharacterTemplate = charactersData.find(c => c.id === templateIdToResetTo);
    
    if (!originalCharacterTemplate) {
        showToastHelper({ title: "Error", description: `Could not find template data for ID: ${templateIdToResetTo}`, variant: "destructive" });
        return;
    }

    let characterToSet: Character = JSON.parse(JSON.stringify(originalCharacterTemplate));

    // Ensure templateId and id are correctly set after cloning
    characterToSet.templateId = templateIdToResetTo;
    characterToSet.id = editableCharacterData.id; // Keep the current doc ID if it's a saved char or custom_ timestamp

    // If it's the specific 'custom' template ID being reset, ensure its unique properties are set
    if (templateIdToResetTo === 'custom') {
        const customDefault = charactersData.find(c => c.id === 'custom')!;
        characterToSet.name = customDefault.name; 
        characterToSet.baseStats = { ...initialCustomCharacterStats }; 
        characterToSet.skills = { ...initialSkills };
        characterToSet.abilities = []; 
        characterToSet.characterPoints = customDefault.characterPoints ?? 375;
    }
    
    characterToSet.selectedArsenalCardId = null;
    characterToSet.savedCooldowns = {}; 
    characterToSet.savedQuantities = {};
    
    setEditableCharacterData(characterToSet);
    showToastHelper({ title: "Template Reset", description: `${characterToSet.name}'s sheet has been reset to default template values.` });
};


  const handleAddAbilityToCustomCharacter = () => {
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) || !abilityToAddId) return;


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
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_")) || !skillToPurchase) return;

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
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_"))) return;

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
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_"))) return;

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
    if (!editableCharacterData || !(editableCharacterData.templateId === 'custom' || editableCharacterData.id.startsWith("custom_"))) return;

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
    if ((editableCharacterData?.templateId === 'custom' || editableCharacterData?.id.startsWith("custom_")) && editableCharacterData.skills) {

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
      const effectiveTemplateId = editableCharacterData.templateId || editableCharacterData.id;

      let docIdForFirestore: string = selectedCharacterId; // Default to current selection
      // If it's a custom-named character (custom_timestamp_id) or the base 'custom' template
      if (editableCharacterData.id.startsWith("custom_") || editableCharacterData.id === 'custom') {
         docIdForFirestore = editableCharacterData.id;
      }
      
      const characterToSave: Character = {
        ...editableCharacterData,
        id: docIdForFirestore, 
        templateId: effectiveTemplateId, 
        savedCooldowns: currentAbilityCooldowns,
        savedQuantities: currentAbilityQuantities,
        selectedArsenalCardId: editableCharacterData.selectedArsenalCardId || null,
        lastSaved: new Date().toISOString(),
      };

      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", docIdForFirestore);
      await setDoc(characterRef, characterToSave, { merge: true });
      showToastHelper({ title: "Character Saved!", description: `${characterToSave.name} has been saved successfully.` });

      // Re-fetch saved characters to update the dropdown list
      const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
      const querySnapshot = await getDocs(charactersCollectionRef);
      const savedChars = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<Character, 'id'> & { templateId?: string };
        return { ...data, id: docSnap.id, templateId: data.templateId || docSnap.id };
      });
      setUserSavedCharacters(savedChars);


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
    try {
      // Always try to load the character document with ID 'custom'
      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", "custom"); 
      const docSnap = await getDoc(characterRef);

      if (docSnap.exists()) {
        const savedData = { ...docSnap.data(), id: 'custom', templateId: 'custom' } as Character; // Ensure id and templateId are 'custom'
        
        // Merge with default custom template to ensure all fields are present
        const defaultCustomTemplate = charactersData.find(c => c.id === 'custom')!;
        const freshDefault = JSON.parse(JSON.stringify(defaultCustomTemplate));

        // Prioritize saved data, but use defaults for missing fields
        savedData.name = savedData.name || freshDefault.name;
        savedData.baseStats = { ...freshDefault.baseStats, ...savedData.baseStats };
        savedData.skills = { ...freshDefault.skills, ...savedData.skills };
        savedData.abilities = Array.isArray(savedData.abilities) ? savedData.abilities : [...freshDefault.abilities];
        savedData.characterPoints = typeof savedData.characterPoints === 'number' ? savedData.characterPoints : freshDefault.characterPoints;
        savedData.meleeWeapon = savedData.meleeWeapon || freshDefault.meleeWeapon;
        savedData.rangedWeapon = savedData.rangedWeapon || freshDefault.rangedWeapon;
        savedData.imageUrl = savedData.imageUrl || freshDefault.imageUrl;
        savedData.avatarSeed = savedData.avatarSeed || freshDefault.avatarSeed;
        savedData.savedCooldowns = savedData.savedCooldowns || {};
        savedData.savedQuantities = savedData.savedQuantities || {};
        savedData.selectedArsenalCardId = savedData.selectedArsenalCardId === undefined ? null : savedData.selectedArsenalCardId;


        setEditableCharacterData(JSON.parse(JSON.stringify(savedData))); 
        // If currently selected character is not already 'custom', switch to it.
        // This ensures the dropdown correctly reflects 'Custom Character'
        if (selectedCharacterId !== 'custom') { 
            setSelectedCharacterId('custom'); 
        }
        showToastHelper({ title: "Character Loaded", description: `Loaded your saved custom character: ${savedData.name}.` });
      } else {
        showToastHelper({ title: "Not Found", description: "No saved custom character found. Loaded default template.", variant: "destructive" });
        // Load the default 'custom' template if no saved version exists
        const defaultTemplate = charactersData.find(c => c.id === 'custom');
        if (defaultTemplate) {
            let characterToSet: Character = JSON.parse(JSON.stringify(defaultTemplate));
            characterToSet.templateId = 'custom'; // Ensure templateId is custom
            // Explicitly set default custom values
            characterToSet.name = defaultTemplate.name || 'Custom Character';
            characterToSet.baseStats = { ...initialCustomCharacterStats };
            characterToSet.skills = { ...initialSkills };
            characterToSet.abilities = [];
            characterToSet.characterPoints = defaultTemplate.characterPoints ?? 375;
            characterToSet.selectedArsenalCardId = null;
            characterToSet.savedCooldowns = {};
            characterToSet.savedQuantities = {};

            setEditableCharacterData(characterToSet);
            if (selectedCharacterId !== 'custom') { // Ensure dropdown reflects 'custom'
                setSelectedCharacterId('custom');
            }
        }
      }
    } catch (err) {
      console.error("Error loading saved custom character:", err);
      showToastHelper({ title: "Load Error", description: "Could not load your saved custom character.", variant: "destructive" });
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

  const criticalArsenalError = rawArsenalCards.find(card => card.id === 'error-critical-arsenal');


  const effectiveBaseStats = useMemo(() => {
    if (!editableCharacterData) return { ...initialBaseStats };
    let base = { ...editableCharacterData.baseStats };

    if (equippedArsenalCard) {
        base.hp = Math.max(0, (base.hp || 0) + (equippedArsenalCard.hpMod || 0));
        base.maxHp = Math.max(1, (base.maxHp || 0) + (equippedArsenalCard.maxHpMod || 0));
        base.mv = Math.max(0, (base.mv || 0) + (equippedArsenalCard.mvMod || 0));
        base.def = Math.max(0, (base.def || 0) + (equippedArsenalCard.defMod || 0));
        base.sanity = Math.max(0, (base.sanity || 0) + (equippedArsenalCard.sanityMod || 0));
        base.maxSanity = Math.max(1, (base.maxSanity || 0) + (equippedArsenalCard.maxSanityMod || 0));
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

 const currentMeleeWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
    let weaponToDisplay: Weapon | undefined = editableCharacterData.meleeWeapon
        ? { ...editableCharacterData.meleeWeapon }
        : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };

    if (equippedArsenalCard?.items) {
        const arsenalMeleeItem = equippedArsenalCard.items.find(item =>
            !item.isPet && // Exclude pet items
            (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) &&
            item.parsedWeaponStats?.attack !== undefined &&
            !(item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0) 
        );

        if (arsenalMeleeItem?.parsedWeaponStats?.attack !== undefined) {
            weaponToDisplay = {
                name: arsenalMeleeItem.abilityName || 'Arsenal Melee',
                attack: arsenalMeleeItem.parsedWeaponStats.attack,
                flavorText: arsenalMeleeItem.itemDescription || arsenalMeleeItem.parsedWeaponStats.rawDetails,
            };
        }
    }
    if (equippedArsenalCard?.meleeAttackMod && weaponToDisplay) {
        weaponToDisplay.attack = (weaponToDisplay.attack || 0) + equippedArsenalCard.meleeAttackMod;
    }

    // Logic to hide default "Fists" if no meaningful weapon is provided
    if (weaponToDisplay?.name === "Fists" && weaponToDisplay.attack === 1 && 
        !editableCharacterData.meleeWeapon?.name && 
        !equippedArsenalCard?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && !(i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0)) && 
        !equippedArsenalCard?.meleeAttackMod 
    ) {
        return undefined; 
    }

    return weaponToDisplay;
  }, [editableCharacterData, equippedArsenalCard]);

  const currentRangedWeapon = useMemo(() => {
    if (!editableCharacterData) return undefined;
      let weaponToDisplay: RangedWeapon | undefined = editableCharacterData.rangedWeapon
          ? { ...editableCharacterData.rangedWeapon }
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" };

      if (equippedArsenalCard?.items) {
          const arsenalRangedItem = equippedArsenalCard.items.find(item =>
             !item.isPet && // Exclude pet items
             (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON')) &&
             item.parsedWeaponStats?.attack !== undefined &&
             (item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0) 
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
          weaponToDisplay.attack = (weaponToDisplay.attack || 0) + (equippedArsenalCard.rangedAttackMod || 0);
          weaponToDisplay.range = (weaponToDisplay.range || 0) + (equippedArsenalCard.rangedRangeMod || 0);
      }

    // Logic to hide default "None" if no meaningful weapon is provided
    if (weaponToDisplay?.name === "None" && weaponToDisplay.attack === 0 && weaponToDisplay.range === 0 && 
        !editableCharacterData.rangedWeapon?.name && 
        !equippedArsenalCard?.items.some(i => !i.isPet && (i.isFlaggedAsWeapon || (i.category?.toUpperCase() === 'LOAD OUT' && i.type?.toUpperCase() === 'WEAPON')) && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0)) && 
        !equippedArsenalCard?.rangedAttackMod && !equippedArsenalCard?.rangedRangeMod 
    ) {
      return undefined; 
    }

      return weaponToDisplay;
  }, [editableCharacterData, equippedArsenalCard]);

  const currentCompanion = useMemo(() => {
    if (!equippedArsenalCard || !equippedArsenalCard.items) return null;
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
    if (currentPetHp === null || !currentCompanion?.parsedPetCoreStats?.maxHp || currentCompanion.parsedPetCoreStats.maxHp === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (currentPetHp / currentCompanion.parsedPetCoreStats.maxHp) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  const getPetSanityBarColorClass = () => {
    if (currentPetSanity === null || !currentCompanion?.parsedPetCoreStats?.maxSanity || currentCompanion.parsedPetCoreStats.maxSanity === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (currentPetSanity / currentCompanion.parsedPetCoreStats.maxSanity) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-blue-400';
  };

  const getPetMvBarColorClass = () => {
    if (currentPetMv === null || !currentCompanion?.parsedPetCoreStats?.mv || currentCompanion.parsedPetCoreStats.mv === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (currentPetMv / currentCompanion.parsedPetCoreStats.mv) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  const getPetDefBarColorClass = () => {
     if (currentPetDef === null || !currentCompanion?.parsedPetCoreStats?.def || currentCompanion.parsedPetCoreStats.def === 0) {
      return '[&>div]:bg-gray-400';
    }
    const percentage = (currentPetDef / currentCompanion.parsedPetCoreStats.def) * 100;
    if (percentage <= 33) return '[&>div]:bg-red-500';
    if (percentage <= 66) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-gray-400'; 
  };


  if (authLoading || isLoadingCharacter || !editableCharacterData) {
    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl p-10 text-center">
            <CardTitle className="text-3xl">Loading Character Data...</CardTitle>
            <CardDescription>Please wait a moment.</CardDescription>
        </Card>
    );
  }

  let petMeleeWeaponForDisplay: Weapon | undefined = undefined;
  if (currentCompanion?.parsedPetCoreStats?.meleeAttack !== undefined && currentCompanion.parsedPetCoreStats.meleeAttack > 0) {
    petMeleeWeaponForDisplay = {
      name: currentCompanion.petName ? `${currentCompanion.petName}'s Attack` : "Natural Attack",
      attack: currentCompanion.parsedPetCoreStats.meleeAttack,
      flavorText: currentCompanion.petAbilities || "The companion's natural attack."
    };
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
            currentUser={currentUser}
            isLoadingCharacter={isLoadingCharacter}
            onCharacterDropdownChange={handleCharacterDropdownChange}
            onCustomCharacterNameChange={handleCustomCharacterNameChange}
            onLoadSavedCustomCharacter={handleLoadSavedCustomCharacter}
            onResetStats={resetStats}
        />
        <CardContent className="space-y-6">

          {/* Stats & Equipment Section */}
          <div id="stats-section" className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><UserCog className="mr-2" /> Stats & Equipment</h2>
            <CoreStatsSection
              editableCharacterData={editableCharacterData}
              effectiveBaseStats={effectiveBaseStats}
              highlightedStat={highlightedStat}
              handleStatChange={handleStatChange}
              incrementStat={incrementStat}
              decrementStat={decrementStat}
              handleBuyStatPoint={handleBuyStatPoint}
              handleSellStatPoint={handleSellStatPoint}
              customStatPointBuyConfig={customStatPointBuyConfig}
            />
            <Separator/>
            <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><Swords className="mr-2 h-6 w-6 text-primary" /> Weapons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WeaponDisplay weapon={currentMeleeWeapon} type="melee" equippedArsenalCard={equippedArsenalCard} baseMeleeWeaponName={editableCharacterData.meleeWeapon?.name} />
                    <WeaponDisplay weapon={currentRangedWeapon} type="ranged" equippedArsenalCard={equippedArsenalCard} baseRangedWeaponName={editableCharacterData.rangedWeapon?.name} />
                </div>
            </div>
            {currentCompanion && (
              <>
                <Separator />
                <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <PawPrint className="mr-2 h-6 w-6 text-primary" /> Equipped Companion: {currentCompanion.petName || 'Unnamed Companion'}
                  </h3>
                   {currentCompanion.petStats && !currentCompanion.parsedPetCoreStats && (
                      <p className="text-sm text-muted-foreground mb-2">Raw Stats (Failed to parse for trackers): {currentCompanion.petStats}</p>
                  )}
                  {currentCompanion.petStats && currentCompanion.parsedPetCoreStats && Object.keys(currentCompanion.parsedPetCoreStats).length === 0 && (
                      <p className="text-sm text-muted-foreground mb-2">Raw Stats: {currentCompanion.petStats} (Could not parse for trackers)</p>
                  )}

                  {currentCompanion.parsedPetCoreStats && (currentCompanion.parsedPetCoreStats.maxHp || currentCompanion.parsedPetCoreStats.maxSanity || currentCompanion.parsedPetCoreStats.mv || currentCompanion.parsedPetCoreStats.def || currentCompanion.parsedPetCoreStats.meleeAttack ) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-3">
                      {currentCompanion.parsedPetCoreStats.maxHp !== undefined && currentPetHp !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Heart className="mr-2 h-4 w-4 text-red-500" /> HP
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('hp', 'decrement')} className="h-6 w-6">
                                <Minus className="h-3 w-3" /> 
                              </Button>
                              <Input type="number" value={currentPetHp} readOnly className="w-12 h-6 text-center text-sm font-bold p-1"/>
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('hp', 'increment')} className="h-6 w-6">
                                <Plus className="h-3 w-3" /> 
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetHp / (currentCompanion.parsedPetCoreStats.maxHp || 1)) * 100} className={cn("h-1.5", getPetHpBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetHp} / {currentCompanion.parsedPetCoreStats.maxHp}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats.maxSanity !== undefined && currentPetSanity !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Brain className="mr-2 h-4 w-4 text-blue-400" /> Sanity
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('sanity', 'decrement')} className="h-6 w-6">
                                 <Minus className="h-3 w-3" /> 
                              </Button>
                              <Input type="number" value={currentPetSanity} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('sanity', 'increment')} className="h-6 w-6">
                                <Plus className="h-3 w-3" /> 
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetSanity / (currentCompanion.parsedPetCoreStats.maxSanity || 1)) * 100} className={cn("h-1.5", getPetSanityBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetSanity} / {currentCompanion.parsedPetCoreStats.maxSanity}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats.mv !== undefined && currentPetMv !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Footprints className="mr-2 h-4 w-4 text-green-500" /> MV
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('mv', 'decrement')} className="h-6 w-6">
                                <Minus className="h-3 w-3" /> 
                              </Button>
                              <Input type="number" value={currentPetMv} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('mv', 'increment')} className="h-6 w-6">
                                 <Plus className="h-3 w-3" /> 
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetMv / (currentCompanion.parsedPetCoreStats.mv || 1)) * 100} className={cn("h-1.5", getPetMvBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetMv} / {currentCompanion.parsedPetCoreStats.mv}</p>
                        </div>
                      )}
                      {currentCompanion.parsedPetCoreStats.def !== undefined && currentPetDef !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="flex items-center text-sm font-medium">
                              <Shield className="mr-2 h-4 w-4 text-gray-400" /> DEF
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('def', 'decrement')} className="h-6 w-6">
                                <Minus className="h-3 w-3" /> 
                              </Button>
                              <Input type="number" value={currentPetDef} readOnly className="w-12 h-6 text-center text-sm font-bold p-1" />
                              <Button variant="outline" size="icon" onClick={() => handlePetStatChange('def', 'increment')} className="h-6 w-6">
                                <Plus className="h-3 w-3" /> 
                              </Button>
                            </div>
                          </div>
                          <Progress value={(currentPetDef / (currentCompanion.parsedPetCoreStats.def || 1)) * 100} className={cn("h-1.5", getPetDefBarColorClass())} />
                          <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetDef} / {currentCompanion.parsedPetCoreStats.def}</p>
                        </div>
                      )}
                      {petMeleeWeaponForDisplay && (
                        <div className="md:col-span-2">
                          <WeaponDisplay weapon={petMeleeWeaponForDisplay} type="melee" />
                        </div>
                      )}
                    </div>
                  )}
                  {currentCompanion.petAbilities && (
                    <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-muted-foreground/20">
                      <strong className="text-foreground">Abilities:</strong> {currentCompanion.petAbilities}
                    </p>
                  )}
                  {currentCompanion.petStats && currentCompanion.parsedPetCoreStats === undefined && (
                    <p className="text-xs text-destructive-foreground bg-destructive p-2 rounded-md mt-2">
                      Note: The 'Pet Stats' string "{currentCompanion.petStats}" could not be fully parsed for interactive trackers. Ensure it follows a format like "HP:10 MV:5 DEF:2 SAN:3 ATK:1".
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Abilities Section */}
          <Separator />
          <div id="abilities-section" className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><Sparkles className="mr-2" /> Abilities</h2>
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
          </div>

          {/* Arsenal Section */}
          <Separator />
          <div id="arsenal-section" className="space-y-6">
             <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><Shirt className="mr-2" /> Arsenal</h2>
            <ArsenalTabContent
                editableCharacterData={editableCharacterData}
                arsenalCards={arsenalCards}
                handleArsenalCardChange={handleArsenalCardChange}
                currentCompanion={currentCompanion}
                currentPetHp={currentPetHp}
                currentPetSanity={currentPetSanity}
                handleIncrementPetStat={(statType) => handlePetStatChange(statType as 'hp' | 'sanity' | 'mv' | 'def', 'increment')}
                handleDecrementPetStat={(statType) => handlePetStatChange(statType as 'hp' | 'sanity' | 'mv' | 'def', 'decrement')}
                criticalArsenalError={criticalArsenalError}
            />
          </div>

          {/* Skills Section */}
          <Separator />
          <div id="skills-section" className="space-y-6">
             <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><Library className="mr-2" /> Skills</h2>
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
          </div>

        </CardContent>
        <CardFooter className="flex justify-end pt-6">
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
