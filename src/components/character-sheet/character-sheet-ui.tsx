
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Footprints, Shield, Brain, Swords, UserCircle, Minus, Plus, Save, RotateCcw, BookOpen, Zap, ShieldAlert, Crosshair, ClipboardList, Leaf, Library, BookMarked, HeartHandshake, SlidersHorizontal, Award, Clock, Box, VenetianMask, Search, PersonStanding, Laptop, Star, Wrench, Smile, ShoppingCart, Edit2, Trash2, UserCog, Package, Dices } from "lucide-react";
import type { CharacterStats, CharacterStatDefinition, StatName, Character, Ability, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition, AbilityType } from "@/types/character";
import type { ArsenalCard, ArsenalItem, ParsedStatModifier } from '@/types/arsenal';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/context/auth-context";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const initialBaseStats: CharacterStats = {
  hp: 5, maxHp: 5,
  mv: 2,
  def: 2,
  sanity: 5, maxSanity: 5,
};

const initialCustomCharacterStats: CharacterStats = {
  hp: 1, maxHp: 1,
  mv: 1,
  def: 1,
  sanity: 1, maxSanity: 1,
};

const initialSkills: Skills = {
  ath: 0, cpu: 0, dare: 0, dec: 0, emp: 0, eng: 0, inv: 0, kno: 0, occ: 0, pers: 0, sur: 0, tac: 0, tun: 0,
};

const statDefinitions: CharacterStatDefinition[] = [
  { id: 'hp', label: "Health Points (HP)", icon: Heart, description: "Your character's vitality. Reaching 0 HP usually means defeat." },
  { id: 'sanity', label: "Sanity", icon: Brain, description: "Your character's mental stability. Low sanity can have dire consequences." },
  { id: 'mv', label: "Movement (MV)", icon: Footprints, description: "How many spaces your character can move." },
  { id: 'def', label: "Defense (DEF)", icon: Shield, description: "Reduces incoming damage." },
];

const customStatPointBuyConfig: Record<Exclude<StatName, 'maxHp' | 'maxSanity'>, { cost: number; max: number; base: number }> = {
  hp: { cost: 5, max: 7, base: 1 },
  sanity: { cost: 10, max: 5, base: 1 },
  mv: { cost: 2, max: 6, base: 1 },
  def: { cost: 5, max: 3, base: 1 },
};


const skillDefinitions: SkillDefinition[] = [
  { id: 'ath', label: "Athletics (ATH)", icon: PersonStanding, description: "Prowess at swimming, running, tumbling, and parkour." },
  { id: 'cpu', label: "Computer Use (CPU)", icon: Laptop, description: "Adept at hacking, online research, and navigating networks." },
  { id: 'dare', label: "Dare Devil (DARE)", icon: Star, description: "Fearless and skilled driver/pilot, performs spectacular stunts." },
  { id: 'dec', label: "Deception (DEC)", icon: VenetianMask, description: "Skill in lying, manipulation, sleight of hand, and stealth." },
  { id: 'emp', label: "Empathy (EMP)", icon: HeartHandshake, description: "Ability to triage, tutor, handle animals, and sense motives." },
  { id: 'eng', label: "Engineer (ENG)", icon: Wrench, description: "Proficiency in crafting, repairing, using machinery, and disabling devices." },
  { id: 'inv', label: "Investigate (INV)", icon: Search, description: "Ability to gather info, find clues, and research." },
  { id: 'kno', label: "Knowledge (KNO)", icon: Library, description: "Filled with useful facts on various subjects (not Occult, Eng, CPU)." },
  { id: 'occ', label: "Occult (OCC)", icon: BookMarked, description: "Knowledge of rituals, demonology, alchemy, and ancient scripts." },
  { id: 'pers', label: "Personality (PERS)", icon: Smile, description: "Inner willpower and charisma (Inspirational or Intimidating)." },
  { id: 'sur', label: "Survivalist (SUR)", icon: Leaf, description: "Skilled at living off the land, tracking, and navigation." },
  { id: 'tac', label: "Tactician (TAC)", icon: ClipboardList, description: "Observant, spots details, predicts enemy plans. +1 to turn order roll /2 pts." },
  { id: 'tun', label: "Tuner (TUN)", icon: SlidersHorizontal, description: "Rare individuals born with or acquired skill for visions, sensing danger." },
];


const charactersData: Character[] = [
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
  },
  {
    id: 'gob',
    name: 'Gob',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 4, maxSanity: 4 },
    skills: { ...initialSkills, tac: 3, sur: 2, kno: 3 },
    avatarSeed: 'gob',
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FGob.png?alt=media&token=d5d63a0b-0465-4c50-a179-351ac7cc7fa9`,
    meleeWeapon: { name: "Knife", attack: 2 },
    rangedWeapon: { name: "AR-15", attack: 4, range: 5 },
    abilities: [
      { id: 'gob_vital_shot', name: 'Vital Shot', type: 'Action', description: 'Re-rolls 2 missed Attack Dice.', details: 'A4/R5 - PHYS', cooldown: '2 round CD' },
      { id: 'gob_wounding_strike', name: 'Wounding Strike', type: 'Action', description: 'Bypasses Targets Armor Effect. Damaged targets are WOUNDED for 2 rounds.', details: 'A3/R1' },
      { id: 'gob_leadership', name: 'Leadership', type: 'Action', description: 'Roll 1 combat dice. Allies within 2 spaces increase their Attack or Defense by 1 for 1 round on a HIT.' },
      { id: 'gob_quick_draw', name: 'Quick Draw', type: 'Interrupt', description: 'Push target back 1 space for each HIT.', details: 'A3/R3', cooldown: '2 round CD' },
      { id: 'gob_flare_x3', name: 'Flare x3', type: 'Interrupt', description: 'Place a Flare tile on the map. Enemies within 2 spaces cannot STEALTH. Treat as Light Source.', details: 'R6', maxQuantity: 3 },
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    baseStats: { hp: 6, maxHp: 6, mv: 4, def: 3, sanity: 4, maxSanity: 4 },
    skills: { ...initialSkills, occ: 2, emp: 2, tun: 1 },
    avatarSeed: 'cassandra',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FCassandra.png?alt=media&token=6df9b49f-aeb0-45a1-ae75-7f77945ce18c',
    meleeWeapon: { name: "Saber", attack: 3 },
    rangedWeapon: { name: "Wrangler", attack: 3, range: 3 },
    abilities: [
      { id: 'cass_death_knell', name: 'Death Knell', type: 'Action', description: 'Roll 1 additional Attack Dice for each HP Cassandra is below her Max HP.', details: 'A3/R3 - NETHER', cooldown: '3 round CD' },
      { id: 'cass_anoint_weapon', name: 'Anoint Weapon', type: 'Action', description: 'Targets attacks are now of the ETHER element for 2 rounds.', details: 'R4' },
      { id: 'cass_enrage', name: 'Enrage', type: 'Passive', description: "When Cassie's HP falls to 3 or less she gains the BERSERK buff." },
      { id: 'cass_curse_x4', name: 'Curse x4', type: 'Interrupt', description: 'Target is inflicted with Hex for 1 round.', details: 'R4', maxQuantity: 4 },
      { id: 'cass_healing_light_x4', name: 'Healing Light x4', type: 'Interrupt', description: 'Target regains 1 HP per HIT.', details: 'A3/R4', maxQuantity: 4 },
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'fei',
    name: 'Fei',
    baseStats: { hp: 5, maxHp: 5, mv: 4, def: 2, sanity: 6, maxSanity: 6 },
    skills: { ...initialSkills, occ: 4, emp: 2, kno: 2 },
    avatarSeed: 'fei',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2Ffei.png?alt=media&token=ec84180b-3734-499e-9767-0846580cdce9',
    meleeWeapon: { name: "Punch", attack: 1, flavorText: "A swift punch." },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon." },
    abilities: [
        { id: 'fei_flame_thrower', name: 'Flame Thrower', type: 'Action', description: 'Flamethrower action.', details: 'BEAM - A4/R4 - FIRE', cooldown: '2 round CD' },
        { id: 'fei_shock_grenade', name: 'Shock Grenade', type: 'Action', description: 'Shock grenade action.', details: 'AOE - A3/R4 - ELEC', cooldown: '2 round CD' },
        { id: 'fei_tricks_trade_action', name: 'Tricks of the Trade', type: 'Action', description: 'Choose one of the target\'s Abilities to be disabled for 1 round.', details: 'R6' },
        { id: 'fei_taser_x2', name: 'Taser x2', type: 'Interrupt', description: 'Inflict PARALYZE for 1 round.', details: 'R4', maxQuantity: 2 },
        { id: 'fei_blind_x3', name: 'Blind x3', type: 'Interrupt', description: 'Target is BLIND for 2 rounds.', details: 'R4', maxQuantity: 3 },
        { id: 'fei_immobilize_x4', name: 'Immobilize x4', type: 'Interrupt', description: 'IMMOBILIZE value of 6.', details: 'R4', maxQuantity: 4 },
        { id: 'fei_fanny_pack', name: 'Fanny Pack', type: 'Passive', description: 'Fei can equip 2 Relics or Utility Items without taking up a Gear slot.' },
      ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'michael',
    name: 'Michael',
    baseStats: { hp: 6, maxHp: 6, mv: 5, def: 3, sanity: 5, maxSanity: 5 },
    skills: { ...initialSkills, emp: 2, dec: 2, inv: 2, ath: 2 },
    avatarSeed: 'michael',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FMichael.png?alt=media&token=4674d3b6-5f0e-494c-97cb-b768b84f17fe',
    meleeWeapon: { name: "Kunai", attack: 3 },
    rangedWeapon: { name: "Kunai", attack: 4, range: 2 },
    abilities: [
      { id: 'michael_sneak_attack', name: 'Sneak Attack', type: 'Action', description: 'Target can roll max of 1 Defense from this Attack.', details: 'A2/R2' },
      { id: 'michael_whip_maneuver', name: 'Whip Maneuver', type: 'Action', description: 'Roll 3 combat dice. Move target 1 space for each HIT.', details: 'R3' },
      { id: 'michael_disarm', name: 'Disarm', type: 'Interrupt', description: 'Target is DISARMED for 1 round.', details: 'R3', cooldown: '2 round CD' },
      { id: 'michael_morphine_x3', name: 'Morphine x3', type: 'Interrupt', description: 'Target gains a WARD of 2 but loses 1 Sanity.', details: 'R3', maxQuantity: 3 },
      { id: 'michael_shady', name: 'Shady', type: 'Passive', description: 'Michael gains the STEALTH buff. Critical Hits triggered by Michael inflict 1 BLEED Point on the target.' },
      { id: 'michael_nimble_fingers', name: 'Nimble Fingers', type: 'Passive', description: 'Michael can use 2 Interrupt Actions per round.' },
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'tamara',
    name: 'Tamara',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 4, sanity: 6, maxSanity: 6 },
    skills: { ...initialSkills, emp: 4, pers: 2 },
    avatarSeed: 'tamara',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FEnhanced%20Tamara%20new.png?alt=media&token=f3408528-8abe-4ed5-b518-47e375ca09fb',
    meleeWeapon: { name: "Martial Arts", attack: 2 },
    rangedWeapon: { name: "M7", attack: 3, range: 3 },
    abilities: [
      { id: 'tamara_combat_medic', name: 'Combat Medic', type: 'Action', description: 'Target is Healed 1 HP for each HIT rolled.', details: 'A4/R4', cooldown: '2 round CD' },
      { id: 'tamara_poison', name: 'Poison', type: 'Action', description: 'Target is afflicted with POISON for 2 rounds.', details: 'R3' },
      { id: 'tamara_potion_of_amplification_x3', name: 'Potion of Amplification x3', type: 'Interrupt', description: 'Place Amplification Cloud on map. See Rules.', details: 'R4 - AOE', maxQuantity: 3 },
      { id: 'tamara_team_player', name: 'Team Player', type: 'Interrupt', description: 'Friendly target can use any of their Actions as a Free Action.', details: 'R6', cooldown: '2 round CD' },
      { id: 'tamara_bloody_knuckles', name: 'Bloody Knuckles', type: 'Passive', description: "Using a Melee Attack lowers all of Tammy's cooldowns by 1 round. Tammy is immune to Attacks of Opportunity." },
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'trish',
    name: 'Trish',
    baseStats: { hp: 7, maxHp: 7, mv: 5, def: 3, sanity: 4, maxSanity: 4 },
    skills: { ...initialSkills, ath: 3, pers: 2 },
    avatarSeed: 'trish',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FTrish%20Black%20Shoes.png?alt=media&token=6bb82bb4-c06f-40b1-bd55-5c86a78cedb5',
    meleeWeapon: { name: "Katana", attack: 4 },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" },
    abilities: [
      { id: 'trish_clean_cut', name: 'Clean Cut', type: 'Action', details: 'R1', description: 'Inflicts 4 damage, cannot Critically Hit or be used with Double Attack.'},
      { id: 'trish_counter_strike_x2', name: 'Counter Strike x2', type: 'Interrupt', description: 'Reverse melee attack targetting Trish back to the attacker.', maxQuantity: 2},
      { id: 'trish_deflection_x2', name: 'Deflection x2', type: 'Interrupt', description: 'Negate Ranged Attack targeting Trish or an adjacent ally.', maxQuantity: 2},
      { id: 'trish_double_attack', name: 'Double Attack', type: 'Passive', description: 'If Trish has not taken a Move Action this round she can make a second Melee Attack.'},
      { id: 'trish_iron_will', name: 'Iron Will', type: 'Passive', description: 'Everytime Trish inflicts damage she can restore the use of 1 of her Interrupts by 1. This cannot exceed initial count.'},
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'blake',
    name: 'Blake',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 5, maxSanity: 5 },
    skills: { ...initialSkills, eng: 2, sur: 2, tac: 2 },
    avatarSeed: 'blake',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FBlake%202.png?alt=media&token=6992782d-124a-44ff-8eec-be9cfd0221f2',
    meleeWeapon: { name: "Kukri", attack: 4 },
    rangedWeapon: { name: "Outlaw .44", attack: 3, range: 3 },
    abilities: [
      { id: 'blake_mark_target', name: 'Mark Target', type: 'Action', details: 'R8', description: 'Target is MARKED for 1 round.'},
      { id: 'blake_restock', name: 'Restock', type: 'Action', description: "Restock one of Blake's Interrupts by 1. Cannot exceed initial count."},
      { id: 'blake_shotgun_x2', name: 'Shotgun x2', type: 'Interrupt', details: 'BEAM - A4/R3 - PHYS', description: 'Interrupt Attack.', maxQuantity: 2},
      { id: 'blake_barricade_x1', name: 'Barricade x1', type: 'Interrupt', details: 'R2', description: 'Any allies adjacent of the Barricade gain the COVER Buff for 2 rounds.', maxQuantity: 1},
      { id: 'blake_tricks_trade_x1', name: 'Tricks of the Trade x1', type: 'Interrupt', details: 'R4', description: 'Inflict TRICKS OF THE TRADE for 1 round.', maxQuantity: 1},
      { id: 'blake_multi_attack', name: 'Multi-Attack', type: 'Passive', description: 'Re-roll 1 missed Attack dice. Max once per round.'},
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
  {
    id: 'walter',
    name: 'Walter',
    baseStats: { hp: 9, maxHp: 9, mv: 4, def: 4, sanity: 5, maxSanity: 5 },
    skills: { ...initialSkills, dare: 2, cpu: 2, pers: 2 },
    avatarSeed: 'walter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FWalter.png?alt=media&token=0f5ccd9d-7f35-4400-b9a4-c5d4f5e051e7',
    meleeWeapon: { name: "Mace", attack: 3 },
    rangedWeapon: { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" },
    abilities: [
      { id: 'walter_wild_swing', name: 'Wild Swing', type: 'Action', details: 'A4/R1- CLEAVE', description: 'CLEAVE. 1 round CD.', cooldown: '1 round CD'},
      { id: 'walter_swap_out', name: 'Swap Out', type: 'Action', description: 'Walter swaps between Arsenals.'},
      { id: 'walter_blow_for_blow', name: 'Blow for Blow', type: 'Interrupt', details: 'R1', description: 'Walter Lowers the targets Defense by 1 for 1 round. 2 round CD.', cooldown: '2 round CD'},
      { id: 'walter_intervene_x4', name: 'Intervene x4', type: 'Interrupt', details: 'R4', description: 'Walter takes space of another unit within range. Unit is moved to an adjacent open space.', maxQuantity: 4},
      { id: 'walter_parry', name: 'Parry', type: 'Passive', description: 'Double Swords count as a block. Does not count for Perfect Defense. Allies adjacent to Walter also benefit from Parry.'},
      { id: 'walter_load_out', name: 'Load Out', type: 'Passive', description: 'Walter can store 1 backup Arsenal that must be picked at the start of the Investigation.'},
    ],
    characterPoints: 375,
    selectedArsenalCardId: null,
  },
];

type AbilityWithCost = Ability & { cost: number };

const allUniqueAbilities: AbilityWithCost[] = (() => {
  const abilitiesMap = new Map<string, AbilityWithCost>();
  charactersData.forEach(character => {
    if (character.id === 'custom') return;
    character.abilities.forEach(ability => {
      if (!abilitiesMap.has(ability.id)) {
        abilitiesMap.set(ability.id, { ...ability, cost: 50 });
      }
    });
  });
  return Array.from(abilitiesMap.values());
})();

const SKILL_COST_LEVEL_1 = 10;
const SKILL_COST_LEVEL_2 = 5; 
const SKILL_COST_LEVEL_3 = 10; 
const MAX_SKILL_LEVEL = 3;

interface CharacterSheetUIProps {
  arsenalCards: ArsenalCard[];
}

export function CharacterSheetUI({ arsenalCards }: CharacterSheetUIProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [editableCharacterData, setEditableCharacterData] = useState<Character | null>(null);
  const [userSavedCharacters, setUserSavedCharacters] = useState<Character[]>([]);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  const [abilityToAddId, setAbilityToAddId] = useState<string | undefined>(undefined);
  const [skillToPurchase, setSkillToPurchase] = useState<SkillName | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);

  const { toast } = useToast();
  const { currentUser, loading: authLoading, error: authError, setError: setAuthError } = useAuth();

  const showToastHelper = useCallback((options: { title: string; description: string; variant?: "default" | "destructive" }) => {
    setTimeout(() => {
        toast(options);
    }, 0);
  }, [toast]);

  const parseCooldownRounds = useCallback((cooldownString?: string): number | undefined => {
    if (!cooldownString) return undefined;
    const match = cooldownString.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }, []);
  
  const equippedArsenalCard = useMemo(() => {
    if (!editableCharacterData?.selectedArsenalCardId || !arsenalCards) {
      return null;
    }
    return arsenalCards.find(card => card.id === editableCharacterData.selectedArsenalCardId) || null;
  }, [editableCharacterData?.selectedArsenalCardId, arsenalCards]);

  const effectiveBaseStats = useMemo(() => {
    if (!editableCharacterData) return initialBaseStats;
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
        if (item.category === 'GEAR' && item.parsedStatModifiers) {
          item.parsedStatModifiers.forEach(mod => {
            const statKey = mod.targetStat as keyof CharacterStats;
            if (statKey in base) {
              (base[statKey] as number) = Math.max(
                (statKey === 'maxHp' || statKey === 'maxSanity') ? 1 : 0, 
                (base[statKey] || 0) + mod.value
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
    let weaponToDisplay: Weapon | undefined = editableCharacterData?.meleeWeapon
        ? { ...editableCharacterData.meleeWeapon }
        : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };

    if (equippedArsenalCard?.items) {
        const arsenalMeleeItem = 
            equippedArsenalCard.items.find(item => item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON' && !(item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0)) ||
            equippedArsenalCard.items.find(item => item.category?.toUpperCase() === 'WEAPON' && !(item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0));

        if (arsenalMeleeItem?.parsedWeaponStats?.attack !== undefined) {
            weaponToDisplay = {
                name: arsenalMeleeItem.abilityName || 'Arsenal Melee',
                attack: arsenalMeleeItem.parsedWeaponStats.attack,
                flavorText: arsenalMeleeItem.itemDescription || arsenalMeleeItem.parsedWeaponStats.rawDetails,
            };
        }
    }

    if (equippedArsenalCard?.meleeAttackMod) {
        weaponToDisplay.attack = (weaponToDisplay.attack || 0) + equippedArsenalCard.meleeAttackMod;
    }
    
    // Hide default fists if no actual character weapon and no arsenal weapon is providing a melee option
    if (weaponToDisplay.name === "Fists" && weaponToDisplay.attack === 1 && 
        !editableCharacterData?.meleeWeapon && 
        (!equippedArsenalCard?.items.some(i => (i.category === "WEAPON" || i.category === "LOAD OUT") && !(i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0))) &&
        !equippedArsenalCard?.meleeAttackMod
       ) {
        return undefined; 
    }
    return weaponToDisplay;
  }, [editableCharacterData?.meleeWeapon, equippedArsenalCard]);

  const currentRangedWeapon = useMemo(() => {
      let weaponToDisplay: RangedWeapon | undefined = editableCharacterData?.rangedWeapon
          ? { ...editableCharacterData.rangedWeapon }
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" };

      if (equippedArsenalCard?.items) {
          const arsenalRangedItem = 
              equippedArsenalCard.items.find(item => item.category?.toUpperCase() === 'LOAD OUT' && item.type?.toUpperCase() === 'WEAPON' && (item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0)) ||
              equippedArsenalCard.items.find(item => item.category?.toUpperCase() === 'WEAPON' && (item.parsedWeaponStats?.range && item.parsedWeaponStats.range > 0));
          
          if (arsenalRangedItem?.parsedWeaponStats?.attack !== undefined && arsenalRangedItem.parsedWeaponStats.range !== undefined) {
              weaponToDisplay = {
                  name: arsenalRangedItem.abilityName || 'Arsenal Ranged',
                  attack: arsenalRangedItem.parsedWeaponStats.attack,
                  range: arsenalRangedItem.parsedWeaponStats.range,
                  flavorText: arsenalRangedItem.itemDescription || arsenalRangedItem.parsedWeaponStats.rawDetails,
              };
          }
      }
      
      if (equippedArsenalCard) {
          weaponToDisplay.attack = (weaponToDisplay.attack || 0) + (equippedArsenalCard.rangedAttackMod || 0);
          weaponToDisplay.range = (weaponToDisplay.range || 0) + (equippedArsenalCard.rangedRangeMod || 0);
      }

      if (weaponToDisplay.name === "None" && weaponToDisplay.attack === 0 && weaponToDisplay.range === 0 &&
          !editableCharacterData?.rangedWeapon &&
          (!equippedArsenalCard?.items.some(i => (i.category === "WEAPON" || i.category === "LOAD OUT") && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0))) &&
          !equippedArsenalCard?.rangedAttackMod && !equippedArsenalCard?.rangedRangeMod
         ) {
          return undefined;
      }
      return weaponToDisplay;
  }, [editableCharacterData?.rangedWeapon, equippedArsenalCard]);


  const [currentAbilityCooldowns, setCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [maxAbilityCooldowns, setMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [currentAbilityQuantities, setCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [maxAbilityQuantities, setMaxAbilityQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUserSavedCharacters = async () => {
      if (currentUser && auth.currentUser) {
        try {
          const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
          const querySnapshot = await getDocs(charactersCollectionRef);
          const savedChars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
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
  }, [currentUser, showToastHelper, isSaving]); 


  const characterDropdownOptions = useMemo(() => {
    return charactersData.map(templateChar => {
      const savedUserVersion = userSavedCharacters.find(savedChar => savedChar.id === templateChar.id);
      let displayLabel = templateChar.name;

      if (savedUserVersion) {
        if (templateChar.id === 'custom' && savedUserVersion.name && savedUserVersion.name !== templateChar.name) {
          displayLabel = `${savedUserVersion.name} (Custom Character)`;
        } else {
          displayLabel = `${templateChar.name} (Saved)`;
        }
      }
      return {
        id: templateChar.id,
        name: templateChar.name,
        displayNameInDropdown: displayLabel,
      };
    }).sort((a, b) => a.displayNameInDropdown.localeCompare(b.displayNameInDropdown));
  }, [userSavedCharacters]);


  useEffect(() => {
    const loadCharacterData = async () => {
      if (!selectedCharacterId) {
          setIsLoadingCharacter(false);
          return;
      }

      setIsLoadingCharacter(true);
      if(setAuthError) setAuthError(null);

      let characterToLoad: Character | undefined = undefined;
      const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);

      if (selectedCharacterId === 'custom') {
        // Always load the default custom template first
        characterToLoad = JSON.parse(JSON.stringify(defaultTemplate));
        if (characterToLoad) {
            characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
            characterToLoad.name = defaultTemplate?.name || 'Custom Character';
            characterToLoad.baseStats = { ...(defaultTemplate?.baseStats || initialCustomCharacterStats) };
            characterToLoad.skills = { ...(defaultTemplate?.skills || initialSkills) };
            characterToLoad.abilities = defaultTemplate?.abilities ? [...defaultTemplate.abilities] : [];
            characterToLoad.characterPoints = defaultTemplate?.characterPoints || 375;
            characterToLoad.selectedArsenalCardId = null; // Ensure default template has no arsenal selected
        }
        showToastHelper({ title: "Template Loaded", description: `Loaded default Custom Character template.` });
      } else if (currentUser && auth.currentUser) {
        try {
          const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", selectedCharacterId);
          const docSnap = await getDoc(characterRef); 

          if (docSnap.exists()) {
            characterToLoad = { id: selectedCharacterId, ...docSnap.data() } as Character;
            characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null; 
            showToastHelper({ title: "Character Loaded", description: `Loaded saved version of ${characterToLoad.name}.` });
          }
        } catch (err: any) {
          console.error("Error loading character from Firestore:", err);
          showToastHelper({ title: "Load Failed", description: "Could not load saved data. Checking default.", variant: "destructive" });
        }
      }

      if (!characterToLoad && defaultTemplate) {
        characterToLoad = JSON.parse(JSON.stringify(defaultTemplate));
         if (characterToLoad) {
            characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
         }
        if (selectedCharacterId !== 'custom' && currentUser) { 
           showToastHelper({ title: "Default Loaded", description: `Loaded default version of ${characterToLoad?.name}. No saved data found.` });
        }
      }
      
      if (characterToLoad && !characterToLoad.skills) {
        characterToLoad.skills = { ...initialSkills };
      }
      
      setEditableCharacterData(characterToLoad || defaultTemplate || null);
      setAbilityToAddId(undefined);
      setSkillToPurchase(undefined);
      setIsLoadingCharacter(false);
    };

    loadCharacterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterId, currentUser, setAuthError]); 

  const abilitiesJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.abilities), [editableCharacterData?.abilities]);
  const savedCooldownsJSONKey = useMemo(() => JSON.stringify((editableCharacterData as any)?.savedCooldowns), [(editableCharacterData as any)?.savedCooldowns]);
  const savedQuantitiesJSONKey = useMemo(() => JSON.stringify((editableCharacterData as any)?.savedQuantities), [(editableCharacterData as any)?.savedQuantities]);


  useEffect(() => {
    if (editableCharacterData && editableCharacterData.abilities) {
      const newMaxCDs: Record<string, number> = {};
      const newInitialCurrentCDs: Record<string, number> = {};
      const newMaxQTs: Record<string, number> = {};
      const newInitialCurrentQTs: Record<string, number> = {};

      const savedCDs = (editableCharacterData as any).savedCooldowns as Record<string, number> | undefined;
      const savedQTs = (editableCharacterData as any).savedQuantities as Record<string, number> | undefined;

      editableCharacterData.abilities.forEach(ability => {
        if (ability.cooldown && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          const maxRounds = parseCooldownRounds(ability.cooldown);
          if (maxRounds !== undefined) {
            newMaxCDs[ability.id] = maxRounds;
            newInitialCurrentCDs[ability.id] = (savedCDs && savedCDs[ability.id] !== undefined) ? savedCDs[ability.id] : maxRounds;
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          newMaxQTs[ability.id] = ability.maxQuantity;
          newInitialCurrentQTs[ability.id] = (savedQTs && savedQTs[ability.id] !== undefined) ? savedQTs[ability.id] : ability.maxQuantity;
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
      parseCooldownRounds
  ]);


  const handleCharacterDropdownChange = (id: string) => {
    setSelectedCharacterId(id);
  };

  const handleCustomCharacterNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (editableCharacterData?.id === 'custom') {
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
    if (!editableCharacterData || editableCharacterData.id === 'custom') return; 
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
     if (!editableCharacterData || editableCharacterData.id === 'custom') return;
     const currentStats = editableCharacterData.baseStats;
     if (statName === 'hp' && currentStats.hp >= currentStats.maxHp) return;
     if (statName === 'sanity' && currentStats.sanity >= currentStats.maxSanity) return;
    handleStatChange(statName, (currentStats[statName] || 0) + 1);
  };

  const decrementStat = (statName: StatName) => {
    if (!editableCharacterData || editableCharacterData.id === 'custom') return;
    handleStatChange(statName, (editableCharacterData.baseStats[statName] || 0) - 1);
  };


  const handleBuyStatPoint = (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return;

    const config = customStatPointBuyConfig[statKey];
    const currentVal = editableCharacterData.baseStats[statKey];
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

  const handleSellStatPoint = (statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return;
  
    const currentVal = editableCharacterData.baseStats[statKey];
    const currentPoints = editableCharacterData.characterPoints || 0;
  
    if (currentVal <= 1) { 
      showToastHelper({ title: "Min Reached", description: `${statKey.toUpperCase()} cannot go below 1.`, variant: "destructive" });
      return;
    }
  
    setEditableCharacterData(prev => {
      if (!prev) return null;
      const newStats = { ...prev.baseStats };
      const costToRefund = customStatPointBuyConfig[statKey].cost;
      newStats[statKey] = currentVal - 1;
      if (statKey === 'hp') newStats.maxHp = currentVal - 1;
      if (statKey === 'sanity') newStats.maxSanity = currentVal - 1;
  
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
    const originalCharacterTemplate = charactersData.find(c => c.id === selectedCharacterId);
    if (originalCharacterTemplate) {
        let characterToSet = JSON.parse(JSON.stringify(originalCharacterTemplate));
        
        if (characterToSet.id === 'custom') {
            characterToSet.name = originalCharacterTemplate.name; 
            characterToSet.baseStats = { ...initialCustomCharacterStats }; 
            characterToSet.skills = { ...initialSkills }; 
            characterToSet.abilities = []; 
            characterToSet.characterPoints = charactersData.find(c => c.id === 'custom')?.characterPoints || 375;
        }
        characterToSet.selectedArsenalCardId = null; 
        setEditableCharacterData(characterToSet);
        showToastHelper({ title: "Stats Reset", description: `${characterToSet.name}'s stats, skills, abilities, and arsenal have been reset to default template.` });
    }
  };

  const handleAddAbilityToCustomCharacter = () => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom' || !abilityToAddId) return;

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
    if (currentCP < abilityInfo.cost) {
        showToastHelper({ title: "Not Enough CP", description: `You need ${abilityInfo.cost} CP to add ${abilityInfo.name}. You have ${currentCP}.`, variant: "destructive" });
        return;
    }
    
    const abilityNameForToast = abilityInfo.name;
    const abilityCostForToast = abilityInfo.cost;

    setEditableCharacterData(prevData => {
        if (!prevData) return null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cost, ...abilityToAdd } = abilityInfo; 
        const newAbilities = [...prevData.abilities, abilityToAdd as Ability];
        const newCharacterPoints = currentCP - abilityInfo.cost;
        return { ...prevData, abilities: newAbilities, characterPoints: newCharacterPoints };
    });

    showToastHelper({ title: "Ability Added", description: `${abilityNameForToast} added to Custom Character for ${abilityCostForToast} CP.` });
    setAbilityToAddId(undefined);
  };

  const handlePurchaseSkill = () => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom' || !skillToPurchase) return;
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
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
    showToastHelper({ title: "Skill Added", description: `${skillDef?.label || skillToPurchase} added at level 1.` });
    setSkillToPurchase(undefined);
  };

  const handleIncreaseSkillLevel = (skillId: SkillName) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return;
    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentLevel = currentSkills[skillId] || 0;
    if (currentLevel >= MAX_SKILL_LEVEL) {
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
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
    showToastHelper({ title: "Skill Upgraded", description: `${skillDef?.label || skillId} upgraded to level ${currentLevel + 1}.` });
  };

  const handleDecreaseSkillLevel = (skillId: SkillName) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return;
    const currentSkills = editableCharacterData.skills || { ...initialSkills };
    const currentLevel = currentSkills[skillId] || 0;
    if (currentLevel <= 1) { 
        handleRemoveSkill(skillId); 
        return;
    }

    let refund = 0;
    if (currentLevel === MAX_SKILL_LEVEL) refund = SKILL_COST_LEVEL_3; 
    else if (currentLevel === 2) refund = SKILL_COST_LEVEL_2; 

    const skillDef = skillDefinitions.find(s => s.id === skillId);
    setEditableCharacterData(prevData => {
      if (!prevData) return null;
      const newSkills = { ...currentSkills, [skillId]: currentLevel - 1 };
      const newCharacterPoints = (prevData.characterPoints || 0) + refund;
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
    showToastHelper({ title: "Skill Downgraded", description: `${skillDef?.label || skillId} downgraded to level ${currentLevel - 1}.` });
  };

  const handleRemoveSkill = (skillId: SkillName) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return;
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
      return { ...prevData, skills: newSkills, characterPoints: newCharacterPoints };
    });
    showToastHelper({ title: "Skill Removed", description: `${skillDef?.label || skillId} removed. ${totalRefund} CP refunded.` });
  };

  const purchasedSkills = useMemo(() => {
    if (editableCharacterData?.id === 'custom' && editableCharacterData.skills) {
      return skillDefinitions.filter(def => (editableCharacterData.skills?.[def.id] || 0) > 0);
    }
    return [];
  }, [editableCharacterData]);


  const handleSaveCharacter = async () => {
    if (!currentUser) {
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
      const characterToSave = {
        ...editableCharacterData,
        savedCooldowns: currentAbilityCooldowns, 
        savedQuantities: currentAbilityQuantities, 
        selectedArsenalCardId: editableCharacterData.selectedArsenalCardId || null, 
      };
      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", editableCharacterData.id);
      await setDoc(characterRef, characterToSave, { merge: true }); 
      showToastHelper({ title: "Character Saved!", description: `${editableCharacterData.name} has been saved successfully.` });
      
      const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
      const querySnapshot = await getDocs(charactersCollectionRef);
      const savedChars = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Character));
      setUserSavedCharacters(savedChars);

    } catch (error) {
      console.error("Error saving character: ", error);
      showToastHelper({ title: "Save Failed", description: "Could not save character data. Please try again.", variant: "destructive" });
      if(setAuthError) setAuthError("Failed to save character data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedCustomCharacter = async () => {
    if (!currentUser || !auth.currentUser) {
      showToastHelper({ title: "Not Logged In", description: "Please log in to load your saved character.", variant: "destructive" });
      return;
    }
    if (editableCharacterData?.id !== 'custom') {
      showToastHelper({ title: "Incorrect Character", description: "This action is for the Custom Character template.", variant: "destructive" });
      return;
    }

    setIsLoadingCharacter(true);
    try {
      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", "custom");
      const docSnap = await getDoc(characterRef);

      if (docSnap.exists()) {
        const savedData = { id: "custom", ...docSnap.data() } as Character;
        
        const defaultCustomTemplate = charactersData.find(c => c.id === 'custom')!;
        
        savedData.name = savedData.name || defaultCustomTemplate.name;
        savedData.baseStats = savedData.baseStats || { ...initialCustomCharacterStats };
        savedData.skills = savedData.skills || { ...initialSkills };
        savedData.abilities = Array.isArray(savedData.abilities) ? savedData.abilities : [];
        savedData.characterPoints = typeof savedData.characterPoints === 'number' ? savedData.characterPoints : defaultCustomTemplate.characterPoints;
        savedData.selectedArsenalCardId = savedData.selectedArsenalCardId || null;
        savedData.meleeWeapon = savedData.meleeWeapon || defaultCustomTemplate.meleeWeapon;
        savedData.rangedWeapon = savedData.rangedWeapon || defaultCustomTemplate.rangedWeapon;


        setEditableCharacterData(JSON.parse(JSON.stringify(savedData))); 
        showToastHelper({ title: "Character Loaded", description: `Loaded your saved custom character: ${savedData.name}.` });
      } else {
        showToastHelper({ title: "Not Found", description: "No saved custom character found. Loaded default template.", variant: "destructive" });
        const defaultCustom = charactersData.find(c => c.id === 'custom');
        if (defaultCustom) {
            const charToSet = JSON.parse(JSON.stringify(defaultCustom)); 
            charToSet.selectedArsenalCardId = null; 
            charToSet.name = defaultCustom.name;
            charToSet.baseStats = { ...initialCustomCharacterStats };
            charToSet.skills = { ...initialSkills };
            charToSet.abilities = [];
            charToSet.characterPoints = defaultCustom.characterPoints;
            setEditableCharacterData(charToSet);
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

    allUniqueAbilities.forEach(ability => {
      if (ability.type === 'Action') actions.push(ability);
      else if (ability.type === 'Interrupt') interrupts.push(ability);
      else if (ability.type === 'Passive') passives.push(ability);
    });

    const sortFn = (a: AbilityWithCost, b: AbilityWithCost) => a.name.localeCompare(b.name);

    return {
      actions: actions.sort(sortFn),
      interrupts: interrupts.sort(sortFn),
      passives: passives.sort(sortFn),
    };
  }, []);


  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = effectiveBaseStats[def.id] || 0; 
    const maxValue = def.id === 'hp' ? effectiveBaseStats.maxHp : (def.id === 'sanity' ? effectiveBaseStats.maxSanity : undefined);

    return (
      <div className={cn("p-4 rounded-lg border border-border bg-card/50 shadow-md transition-all duration-300", highlightedStat === def.id ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor={def.id} className="flex items-center text-lg font-medium">
            <def.icon className="mr-2 h-6 w-6 text-primary" />
            {def.label}
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => decrementStat(def.id)} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={def.id}
              type="number"
              value={currentValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.id, e.target.value)}
              className="w-20 h-8 text-center text-lg font-bold"
              min="0"
            />
            <Button variant="outline" size="icon" onClick={() => incrementStat(def.id)} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isProgressStat && maxValue !== undefined && (
          <div className="mt-2">
            <Progress value={(currentValue / maxValue) * 100 || 0} className="h-3 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground text-right mt-1">{currentValue} / {maxValue}</p>
            { (def.id === 'hp' || def.id === 'sanity') &&
                <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor={`max${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`} className="text-sm text-muted-foreground whitespace-nowrap">Max {def.label.split(" ")[0]}:</Label>
                    <Input
                        id={`max${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`}
                        type="number"
                        value={maxValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.id === 'hp' ? 'maxHp' : 'maxSanity', e.target.value)}
                        className="w-20 h-8 text-center"
                        min="1"
                    />
                </div>
            }
          </div>
        )}
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  const CustomStatPointBuyComponent: React.FC<{
    statKey: Exclude<StatName, 'maxHp' | 'maxSanity'>;
    label: string;
    Icon: React.ElementType;
   }> = ({ statKey, label, Icon }) => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom') return null;

    const config = customStatPointBuyConfig[statKey];
    const baseValueFromTemplate = editableCharacterData.baseStats[statKey]; 
    const currentCP = editableCharacterData.characterPoints || 0;
    
    let displayedValue = baseValueFromTemplate || 0;
    let displayedMaxValue = (statKey === 'hp' ? editableCharacterData.baseStats.maxHp : editableCharacterData.baseStats.maxSanity) || 0;

    if (equippedArsenalCard) {
        if (statKey === 'hp') {
            displayedValue += (equippedArsenalCard.hpMod || 0);
            if (equippedArsenalCard.items) {
                equippedArsenalCard.items.forEach(item => {
                    if (item.category === 'GEAR' && item.parsedStatModifiers) {
                        item.parsedStatModifiers.forEach(mod => {
                            if (mod.targetStat === 'hp') displayedValue += mod.value;
                            if (mod.targetStat === 'maxHp') displayedMaxValue += mod.value;
                        });
                    }
                });
            }
            displayedMaxValue += (equippedArsenalCard.maxHpMod || 0); 
            if (displayedValue > displayedMaxValue) displayedValue = displayedMaxValue;

        } else if (statKey === 'sanity') {
            displayedValue += (equippedArsenalCard.sanityMod || 0);
             if (equippedArsenalCard.items) {
                equippedArsenalCard.items.forEach(item => {
                    if (item.category === 'GEAR' && item.parsedStatModifiers) {
                        item.parsedStatModifiers.forEach(mod => {
                            if (mod.targetStat === 'sanity') displayedValue += mod.value;
                            if (mod.targetStat === 'maxSanity') displayedMaxValue += mod.value;
                        });
                    }
                });
            }
            displayedMaxValue += (equippedArsenalCard.maxSanityMod || 0);
            if (displayedValue > displayedMaxValue) displayedValue = displayedMaxValue;
        } else if (statKey === 'mv' && equippedArsenalCard.mvMod) {
            displayedValue += equippedArsenalCard.mvMod;
        } else if (statKey === 'def' && equippedArsenalCard.defMod) {
            displayedValue += equippedArsenalCard.defMod;
        }
    }
    displayedValue = Math.max(1, displayedValue); // Ensure displayed current value is at least 1 due to base
    displayedMaxValue = Math.max(1, displayedMaxValue);


    return (
      <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center text-lg font-medium">
            <Icon className="mr-2 h-6 w-6 text-primary" />
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleSellStatPoint(statKey)} disabled={baseValueFromTemplate <= 1} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 h-8 text-center text-lg font-bold flex items-center justify-center">{displayedValue}</span>
            <Button variant="outline" size="icon" onClick={() => handleBuyStatPoint(statKey)} disabled={baseValueFromTemplate >= config.max || currentCP < config.cost} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
         <p className="text-xs text-muted-foreground">Base Points Invested: {baseValueFromTemplate} / {config.max} | Cost: {config.cost} CP per point</p>
        {(statKey === 'hp' || statKey === 'sanity') && (
          <div className="mt-2">
            <Progress value={(displayedValue / displayedMaxValue) * 100 || 0} className="h-3 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground text-right mt-1">{displayedValue} / {displayedMaxValue}</p>
          </div>
        )}
      </div>
    );
  };


  const SkillDisplayComponent: React.FC<{ def: SkillDefinition }> = ({ def }) => {
    const skillValue = (characterSkills as Skills)[def.id as SkillName] || 0;
    return (
      <div className="p-3 rounded-lg border border-border bg-card/50 shadow-sm">
        <div className="flex items-center justify-between">
          <Label htmlFor={def.id} className="flex items-center text-md font-medium">
            <def.icon className="mr-2 h-5 w-5 text-primary" />
            {def.label}
          </Label>
          <span className="text-lg font-bold text-primary">{skillValue}</span>
        </div>
        {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
      </div>
    );
  };

  const WeaponDisplay: React.FC<{ weapon?: Weapon | RangedWeapon, type: 'melee' | 'ranged' }> = ({ weapon, type }) => {
    if (!weapon || weapon.name === "None" || weapon.name === "Fists" && weapon.attack === 1 && type === 'melee' && !editableCharacterData?.meleeWeapon && !equippedArsenalCard?.items.some(i=> (i.category === "WEAPON" || i.category === "LOAD OUT") && !(i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0)) && !equippedArsenalCard?.meleeAttackMod) {
         // Hide default fists if it's the base and no character or arsenal weapon is specified
        if (type === 'melee' && weapon.name === "Fists" && weapon.attack === 1) return null;
        // Hide default "None" for ranged if it's the base and no other source
        if (type === 'ranged' && weapon.name === "None" && weapon.attack === 0 && weapon.range === 0) return null;
    }
    if (!weapon) return null;


    const Icon = type === 'melee' ? Swords : Crosshair;
    const isRanged = 'range' in weapon && weapon.range !== undefined;

    return (
        <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
            <div className="flex items-center mb-2">
                <Icon className="mr-2 h-6 w-6 text-primary" />
                <h4 className="text-lg font-medium">{type === 'melee' ? "Melee Weapon" : "Ranged Weapon"}</h4>
            </div>
            <p><span className="font-semibold">Name:</span> {weapon.name}</p>
            <p><span className="font-semibold">ATK:</span> {weapon.attack}</p>
            {isRanged && <p><span className="font-semibold">RNG:</span> {(weapon as RangedWeapon).range}</p>}
            {weapon.flavorText && <p className="text-xs text-muted-foreground mt-1">{weapon.flavorText}</p>}
            {type === 'ranged' && isRanged && <p className="text-sm text-primary mt-1">Formatted: A{weapon.attack}/R{(weapon as RangedWeapon).range}</p>}
            {type === 'melee' && <p className="text-sm text-primary mt-1">{weapon.attack} attack dmg</p>}
        </div>
    );
  };

  const currentCharacterAbilities = editableCharacterData?.abilities || [];
  const actionAbilities = currentCharacterAbilities.filter(a => a.type === 'Action');
  const interruptAbilities = currentCharacterAbilities.filter(a => a.type === 'Interrupt');
  const passiveAbilities = currentCharacterAbilities.filter(a => a.type === 'Passive');

  interface AbilityCardProps {
    ability: Ability;
    currentCooldown?: number;
    maxCooldown?: number;
    onIncrementCooldown?: () => void;
    onDecrementCooldown?: () => void;
    currentQuantity?: number;
    maxQuantity?: number;
    onIncrementQuantity?: () => void;
    onDecrementQuantity?: () => void;
  }

  const AbilityCard: React.FC<AbilityCardProps> = ({
    ability,
    currentCooldown, maxCooldown, onIncrementCooldown, onDecrementCooldown,
    currentQuantity, maxQuantity, onIncrementQuantity, onDecrementQuantity
  }) => {

    const hasTrackableQuantity = ability.maxQuantity !== undefined &&
                                 typeof currentQuantity === 'number' &&
                                 typeof maxQuantity === 'number' &&
                                 onIncrementQuantity &&
                                 onDecrementQuantity;

    const hasTrackableCooldown = !hasTrackableQuantity &&
                                 ability.cooldown &&
                                 typeof currentCooldown === 'number' &&
                                 typeof maxCooldown === 'number' &&
                                 onIncrementCooldown &&
                                 onDecrementCooldown;

    return (
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg text-primary">{ability.name}</CardTitle>
          {ability.details && <CardDescription className="text-xs">{ability.details}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{ability.description}</p>

          {hasTrackableQuantity && (
            <div className="mt-3 pt-3 border-t border-muted-foreground/20">
              <div className='flex justify-between items-center mb-1'>
                <Label htmlFor={`${ability.id}-quantity`} className="text-sm font-medium text-green-400 flex items-center">
                  <Box className="mr-1 h-4 w-4" /> Charges
                </Label>
                {ability.maxQuantity && <span className="text-xs text-muted-foreground">(Max: {ability.maxQuantity})</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onDecrementQuantity} disabled={currentQuantity === 0} className="h-8 w-8">
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id={`${ability.id}-quantity`}
                  type="number"
                  value={currentQuantity}
                  readOnly
                  className="w-16 h-8 text-center text-lg font-bold"
                />
                <Button variant="outline" size="icon" onClick={onIncrementQuantity} disabled={currentQuantity === maxQuantity} className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-medium text-muted-foreground">/ {maxQuantity}</span>
              </div>
            </div>
          )}

          {hasTrackableCooldown && (
            <div className="mt-3 pt-3 border-t border-muted-foreground/20">
              <div className='flex justify-between items-center mb-1'>
                <Label htmlFor={`${ability.id}-cooldown`} className="text-sm font-medium text-amber-400 flex items-center">
                  <Clock className="mr-1 h-4 w-4" /> Current Cooldown
                </Label>
                 {ability.cooldown && <span className="text-xs text-muted-foreground">({ability.cooldown})</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onDecrementCooldown} disabled={currentCooldown === 0} className="h-8 w-8">
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id={`${ability.id}-cooldown`}
                  type="number"
                  value={currentCooldown}
                  readOnly
                  className="w-16 h-8 text-center text-lg font-bold"
                />
                <Button variant="outline" size="icon" onClick={onIncrementCooldown} disabled={currentCooldown === maxCooldown} className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-medium text-muted-foreground">/ {maxCooldown}</span>
              </div>
            </div>
          )}

          {!hasTrackableQuantity && !hasTrackableCooldown && ability.cooldown && (
            <p className="text-xs text-amber-400 mt-1 flex items-center">
              <Clock className="mr-1 h-3 w-3" /> Cooldown: {ability.cooldown}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (authLoading || isLoadingCharacter || !editableCharacterData) {
    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl p-10 text-center">
            <CardTitle>Loading Character Data...</CardTitle>
            <CardDescription>Please wait a moment.</CardDescription>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl relative overflow-hidden">
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
        <CardHeader>
          <div className="flex items-center justify-between">
              <div className="flex items-center">
                  <UserCircle className="mr-3 h-10 w-10 text-primary" />
                  <CardTitle className="text-3xl">Character Sheet</CardTitle>
              </div>
              <Button variant="ghost" onClick={resetStats} size="sm">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Template
              </Button>
          </div>
          <CardDescription>Manage your character's attributes, abilities, and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 space-y-4">
              <div className="w-full">
                <Label htmlFor="characterName" className="text-lg font-medium mb-1 block">Character Template</Label>
                <Select value={selectedCharacterId} onValueChange={handleCharacterDropdownChange}>
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
                        value={editableCharacterData.name === 'Custom Character' && !userSavedCharacters.find(c => c.id === 'custom' && c.name !== 'Custom Character') ? '' : editableCharacterData.name}
                        onChange={handleCustomCharacterNameChange}
                        placeholder="Enter custom name"
                        className="text-lg p-2 flex-grow"
                      />
                      <Edit2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  {currentUser && (
                    <Button 
                      onClick={handleLoadSavedCustomCharacter} 
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

          {editableCharacterData.id === 'custom' && (
            <>
            <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-lg bg-card/30">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" /> Custom Ability Selection
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                <div className="w-full">
                  <Label htmlFor="abilitySelect" className="text-sm text-muted-foreground">Choose an ability to add (Cost: 50 CP):</Label>
                  <Select value={abilityToAddId} onValueChange={setAbilityToAddId}>
                    <SelectTrigger id="abilitySelect">
                      <SelectValue placeholder="Select an ability" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorizedAbilities.actions.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-base text-primary">Actions</SelectLabel>
                          {categorizedAbilities.actions.map(ability => (
                            <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                              {ability.name} ({ability.type}) - {ability.cost} CP
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                       {categorizedAbilities.interrupts.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-base text-primary">Interrupts</SelectLabel>
                          {categorizedAbilities.interrupts.map(ability => (
                            <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                              {ability.name} ({ability.type}) - {ability.cost} CP
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                       {categorizedAbilities.passives.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-base text-primary">Passives</SelectLabel>
                          {categorizedAbilities.passives.map(ability => (
                            <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                              {ability.name} ({ability.type}) - {ability.cost} CP
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddAbilityToCustomCharacter}
                  disabled={!abilityToAddId || (editableCharacterData.characterPoints || 0) < (allUniqueAbilities.find(a=>a.id === abilityToAddId)?.cost || Infinity)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add Ability
                </Button>
              </div>
            </div>
             <Separator />
            </>
          )}

          {arsenalCards && arsenalCards.length > 0 && !(arsenalCards.length === 1 && arsenalCards[0].id.startsWith('error-')) && (
            <>
              <div className="space-y-2 p-4 border border-dashed border-accent/50 rounded-lg bg-card/30">
                <Label htmlFor="arsenalCardSelect" className="text-lg font-medium text-accent flex items-center">
                  <Package className="mr-2 h-5 w-5" /> Arsenal Loadout
                </Label>
                <Select
                  value={editableCharacterData.selectedArsenalCardId || "none"}
                  onValueChange={handleArsenalCardChange}
                >
                  <SelectTrigger id="arsenalCardSelect">
                    <SelectValue placeholder="Select Arsenal Loadout..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {arsenalCards.filter(card => !card.id.startsWith('error-') && !card.id.startsWith('warning-')).map(card => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equippedArsenalCard && (
                  <Card className="mt-2 p-3 bg-card/60 border-accent/70">
                    <CardTitle className="text-md text-accent mb-2">{equippedArsenalCard.name}</CardTitle>
                    {equippedArsenalCard.description && <CardDescription className="text-xs mt-1 mb-2">{equippedArsenalCard.description}</CardDescription>}
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="arsenal-contents">
                        <AccordionTrigger className="text-sm hover:no-underline">View Contents ({equippedArsenalCard.items.length})</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-2">
                            <div className="space-y-2 text-xs mt-2">
                              {equippedArsenalCard.items.map(item => (
                                <div key={item.id} className="p-2 border border-muted-foreground/20 rounded-md bg-background/30">
                                  <p className="font-semibold text-foreground">
                                    {item.abilityName || 'Unnamed Item'}
                                    {(item.category === 'WEAPON' && item.parsedWeaponStats?.rawDetails && item.parsedWeaponStats.rawDetails !== item.abilityName) ? ` (${item.parsedWeaponStats.rawDetails})` : (item.class ? ` (${item.class})` : '')}
                                    <span className="text-muted-foreground text-xs"> ({item.category || 'N/A'})</span>
                                  </p>
                                  {item.itemDescription && <p className="text-muted-foreground">{item.itemDescription}</p>}
                                  
                                  {item.category === 'WEAPON' && item.parsedWeaponStats?.attack !== undefined && (
                                    <p><span className="font-medium text-primary/80">Attack:</span> {item.parsedWeaponStats.attack}
                                    {item.parsedWeaponStats?.range !== undefined && <span className="ml-2"><span className="font-medium text-primary/80">Range:</span> {item.parsedWeaponStats.range}</span>}
                                    </p>
                                  )}

                                  {item.effect && <p><span className="font-medium text-primary/80">Effect:</span> {item.effect}</p>}
                                  {item.secondaryEffect && <p><span className="font-medium text-primary/80">Secondary:</span> {item.secondaryEffect}</p>}
                                  
                                  {item.parsedStatModifiers && item.parsedStatModifiers.length > 0 && (
                                    <p><span className="font-medium text-primary/80">Stat Changes:</span> {item.parsedStatModifiers.map(mod => `${mod.targetStat.toUpperCase()}: ${mod.value > 0 ? '+' : ''}${mod.value}`).join(', ')}</p>
                                  )}
                                   {item.qty && <p><span className="font-medium text-primary/80">Qty:</span> {item.qty}</p>}
                                   {item.cd && <p><span className="font-medium text-primary/80">CD:</span> {item.cd}</p>}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-3 text-xs space-y-0.5">
                        <p className="font-medium text-muted-foreground">Global Stat Modifiers (from Arsenal Card itself):</p>
                        {equippedArsenalCard.hpMod !== 0 && typeof equippedArsenalCard.hpMod === 'number' && <p>HP Mod: {equippedArsenalCard.hpMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.maxHpMod !== 0 && typeof equippedArsenalCard.maxHpMod === 'number' && <p>Max HP Mod: {equippedArsenalCard.maxHpMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.mvMod !== 0 && typeof equippedArsenalCard.mvMod === 'number' && <p>MV Mod: {equippedArsenalCard.mvMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.defMod !== 0 && typeof equippedArsenalCard.defMod === 'number' && <p>DEF Mod: {equippedArsenalCard.defMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.sanityMod !== 0 && typeof equippedArsenalCard.sanityMod === 'number' && <p>Sanity Mod: {equippedArsenalCard.sanityMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.maxSanityMod !== 0 && typeof equippedArsenalCard.maxSanityMod === 'number' && <p>Max Sanity Mod: {equippedArsenalCard.maxSanityMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.meleeAttackMod !== 0 && typeof equippedArsenalCard.meleeAttackMod === 'number' && <p>Melee Attack Mod: {equippedArsenalCard.meleeAttackMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.rangedAttackMod !== 0 && typeof equippedArsenalCard.rangedAttackMod === 'number' && <p>Ranged Attack Mod: {equippedArsenalCard.rangedAttackMod?.toFixed(0)}</p>}
                        {equippedArsenalCard.rangedRangeMod !== 0 && typeof equippedArsenalCard.rangedRangeMod === 'number' && <p>Ranged Range Mod: {equippedArsenalCard.rangedRangeMod?.toFixed(0)}</p>}
                         {![equippedArsenalCard.hpMod, equippedArsenalCard.maxHpMod, equippedArsenalCard.mvMod, equippedArsenalCard.defMod, equippedArsenalCard.sanityMod, equippedArsenalCard.maxSanityMod, equippedArsenalCard.meleeAttackMod, equippedArsenalCard.rangedAttackMod, equippedArsenalCard.rangedRangeMod].some(mod => mod && mod !== 0) && (
                            <p className="italic">No global stat modifiers.</p>
                        )}
                    </div>
                  </Card>
                )}
              </div>
              <Separator />
            </>
          )}


          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3"> 
              <TabsTrigger value="stats">Stats &amp; Equipment</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger> 
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary" /> Core Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editableCharacterData.id === 'custom' ? (
                    <>
                      {(Object.keys(customStatPointBuyConfig) as Array<Exclude<StatName, 'maxHp' | 'maxSanity'>>).map(statKey => {
                          const statDef = statDefinitions.find(s => s.id === statKey);
                          if (!statDef) return null;
                          return (
                            <CustomStatPointBuyComponent
                              key={statKey}
                              statKey={statKey}
                              label={statDef.label}
                              Icon={statDef.icon}
                            />
                          );
                      })}
                    </>
                  ) : (
                    statDefinitions.map(def => <StatInputComponent key={def.id} def={def} />)
                  )}
                </div>
              </div>
              <Separator/>
              <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center"><Swords className="mr-2 h-6 w-6 text-primary" /> Weapons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WeaponDisplay weapon={currentMeleeWeapon} type="melee" />
                      <WeaponDisplay weapon={currentRangedWeapon} type="ranged" />
                  </div>
              </div>
            </TabsContent>
            <TabsContent value="skills" className="mt-6 space-y-6"> 
              {editableCharacterData.id === 'custom' ? (
                <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-lg bg-card/30">
                  <h3 className="text-xl font-semibold text-primary flex items-center">
                    <Library className="mr-2 h-6 w-6" /> Manage Custom Skills
                  </h3>
                   <p className="text-sm text-muted-foreground">Available CP: {editableCharacterData.characterPoints}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                    <div className="w-full">
                      <Label htmlFor="skillPurchaseSelect" className="text-sm text-muted-foreground">Choose a skill to add (Cost: {SKILL_COST_LEVEL_1} CP for Level 1):</Label>
                      <Select value={skillToPurchase} onValueChange={(value) => setSkillToPurchase(value as SkillName)}>
                        <SelectTrigger id="skillPurchaseSelect">
                          <SelectValue placeholder="Select a skill to purchase" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillDefinitions
                            .filter(def => (characterSkills[def.id] || 0) === 0) 
                            .map(def => (
                            <SelectItem key={def.id} value={def.id} disabled={(editableCharacterData.characterPoints || 0) < SKILL_COST_LEVEL_1}>
                              {def.label} - {SKILL_COST_LEVEL_1} CP
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handlePurchaseSkill}
                      disabled={!skillToPurchase || (editableCharacterData.characterPoints || 0) < SKILL_COST_LEVEL_1}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Add Skill
                    </Button>
                  </div>
                  <Separator className="my-4"/>
                  {purchasedSkills.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-muted-foreground">Purchased Skills:</h4>
                      {purchasedSkills.map(skillDef => {
                        const currentLevel = characterSkills[skillDef.id] || 0;
                        let upgradeCost = 0;
                        if (currentLevel === 1) upgradeCost = SKILL_COST_LEVEL_2;
                        else if (currentLevel === 2) upgradeCost = SKILL_COST_LEVEL_3;
                        
                        return (
                          <Card key={skillDef.id} className="p-3 bg-card/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <skillDef.icon className="mr-2 h-5 w-5 text-primary" />
                                <span className="font-medium">{skillDef.label} - Level {currentLevel}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => handleDecreaseSkillLevel(skillDef.id)}
                                  disabled={currentLevel <= 0} 
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => handleIncreaseSkillLevel(skillDef.id)}
                                  disabled={currentLevel >= MAX_SKILL_LEVEL || (editableCharacterData.characterPoints || 0) < upgradeCost}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                                  onClick={() => handleRemoveSkill(skillDef.id)}
                                  disabled={currentLevel === 0}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                              </div>
                            </div>
                            {currentLevel < MAX_SKILL_LEVEL && currentLevel > 0 && <p className="text-xs text-muted-foreground mt-1">Next Level Cost: {upgradeCost} CP</p>}
                             <p className="text-xs text-muted-foreground mt-1">{skillDef.description}</p>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No skills purchased yet.</p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center"><Library className="mr-2 h-6 w-6 text-primary" /> Skills</h3>
                  {
                    (() => {
                      const relevantSkillDefinitions = skillDefinitions.filter(def => ((characterSkills as Skills)[def.id as SkillName] ?? 0) > 0);
                      if (relevantSkillDefinitions.length === 0) {
                        return <p className="text-muted-foreground text-center py-4 bg-card/50 rounded-md">This character has no specialized skills.</p>;
                      }
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {relevantSkillDefinitions.map(def => <SkillDisplayComponent key={def.id} def={def} />)}
                        </div>
                      );
                    })()
                  }
                </div>
              )}
            </TabsContent>
            <TabsContent value="abilities" className="mt-6">
              {currentCharacterAbilities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 bg-card/50 rounded-md">This character has no special abilities defined{editableCharacterData.id === 'custom' ? ' or selected' : ''}.</p>
              ) : (
                <div className="space-y-6">
                  {actionAbilities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center"><BookOpen className="mr-2 h-6 w-6 text-primary" /> Actions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {actionAbilities.map(ability => {
                            const isTrackableCooldown = ability.cooldown && maxAbilityCooldowns[ability.id] !== undefined && currentAbilityCooldowns[ability.id] !== undefined;
                            const isTrackableQuantity = ability.maxQuantity !== undefined && maxAbilityQuantities[ability.id] !== undefined && currentAbilityQuantities[ability.id] !== undefined;
                            return (
                                <AbilityCard
                                key={ability.id}
                                ability={ability}
                                currentCooldown={isTrackableCooldown ? currentAbilityCooldowns[ability.id] : undefined}
                                maxCooldown={isTrackableCooldown ? maxAbilityCooldowns[ability.id] : undefined}
                                onIncrementCooldown={isTrackableCooldown ? () => handleIncrementCooldown(ability.id) : undefined}
                                onDecrementCooldown={isTrackableCooldown ? () => handleDecrementCooldown(ability.id) : undefined}
                                currentQuantity={isTrackableQuantity ? currentAbilityQuantities[ability.id] : undefined}
                                maxQuantity={isTrackableQuantity ? maxAbilityQuantities[ability.id] : undefined}
                                onIncrementQuantity={isTrackableQuantity ? () => handleIncrementQuantity(ability.id) : undefined}
                                onDecrementQuantity={isTrackableQuantity ? () => handleDecrementQuantity(ability.id) : undefined}
                                />
                            );
                        })}
                      </div>
                    </div>
                  )}
                  {interruptAbilities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center"><Zap className="mr-2 h-6 w-6 text-primary" /> Interrupts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {interruptAbilities.map(ability => {
                           const isTrackableCooldown = ability.cooldown && maxAbilityCooldowns[ability.id] !== undefined && currentAbilityCooldowns[ability.id] !== undefined;
                           const isTrackableQuantity = ability.maxQuantity !== undefined && maxAbilityQuantities[ability.id] !== undefined && currentAbilityQuantities[ability.id] !== undefined;
                           return (
                                <AbilityCard
                                    key={ability.id}
                                    ability={ability}
                                    currentCooldown={isTrackableCooldown ? currentAbilityCooldowns[ability.id] : undefined}
                                    maxCooldown={isTrackableCooldown ? maxAbilityCooldowns[ability.id] : undefined}
                                    onIncrementCooldown={isTrackableCooldown ? () => handleIncrementCooldown(ability.id) : undefined}
                                    onDecrementCooldown={isTrackableCooldown ? () => handleDecrementCooldown(ability.id) : undefined}
                                    currentQuantity={isTrackableQuantity ? currentAbilityQuantities[ability.id] : undefined}
                                    maxQuantity={isTrackableQuantity ? maxAbilityQuantities[ability.id] : undefined}
                                    onIncrementQuantity={isTrackableQuantity ? () => handleIncrementQuantity(ability.id) : undefined}
                                    onDecrementQuantity={isTrackableQuantity ? () => handleDecrementQuantity(ability.id) : undefined}
                                />
                           );
                        })}
                      </div>
                    </div>
                  )}
                  {passiveAbilities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-primary" /> Passives</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {passiveAbilities.map(ability => (
                           <AbilityCard key={ability.id} ability={ability} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

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
