"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, UserCircle, Swords, Package, Library, BookOpen, PawPrint, UserMinus, UserPlus, Shirt } from "lucide-react";
import type { CharacterStats, StatName, Character, Ability, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition } from "@/types/character";
import type { ArsenalCard, ArsenalItem } from '@/types/arsenal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/context/auth-context";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

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

const skillDefinitions: SkillDefinition[] = [
  { id: 'ath', label: "Athletics (ATH)", description: "Prowess at swimming, running, tumbling, and parkour.", icon: UserCircle },
  { id: 'cpu', label: "Computer Use (CPU)", description: "Adept at hacking, online research, and navigating networks.", icon: UserCircle },
  { id: 'dare', label: "Dare Devil (DARE)", description: "Fearless and skilled driver/pilot, performs spectacular stunts.", icon: UserCircle },
  { id: 'dec', label: "Deception (DEC)", description: "Skill in lying, manipulation, sleight of hand, and stealth.", icon: UserCircle },
  { id: 'emp', label: "Empathy (EMP)", description: "Ability to triage, tutor, handle animals, and sense motives.", icon: UserCircle },
  { id: 'eng', label: "Engineer (ENG)", description: "Proficiency in crafting, repairing, using machinery, and disabling devices.", icon: UserCircle },
  { id: 'inv', label: "Investigate (INV)", description: "Ability to gather info, find clues, and research.", icon: UserCircle },
  { id: 'kno', label: "Knowledge (KNO)", description: "Filled with useful facts on various subjects (not Occult, Eng, CPU).", icon: UserCircle },
  { id: 'occ', label: "Occult (OCC)", description: "Knowledge of rituals, demonology, alchemy, and ancient scripts.", icon: UserCircle },
  { id: 'pers', label: "Personality (PERS)", description: "Inner willpower and charisma (Inspirational or Intimidating).", icon: UserCircle },
  { id: 'sur', label: "Survivalist (SUR)", description: "Skilled at living off the land, tracking, and navigation.", icon: UserCircle },
  { id: 'tac', label: "Tactician (TAC)", description: "Observant, spots details, predicts enemy plans. +1 to turn order roll /2 pts.", icon: UserCircle },
  { id: 'tun', label: "Tuner (TUN)", description: "Rare individuals born with or acquired skill for visions, sensing danger.", icon: UserCircle },
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
    if (character.id === 'custom') return; // Skip custom character for populating unique abilities
    character.abilities.forEach(ability => {
      if (!abilitiesMap.has(ability.id)) {
        abilitiesMap.set(ability.id, { ...ability, cost: ability.cost ?? 50 });
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

export function CharacterSheetUI({ arsenalCards }: CharacterSheetUIProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [editableCharacterData, setEditableCharacterData] = useState<Character | null>(null);
  const [userSavedCharacters, setUserSavedCharacters] = useState<Character[]>([]);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  const [abilityToAddId, setAbilityToAddId] = useState<string | undefined>(undefined);
  const [skillToPurchase, setSkillToPurchase] = useState<SkillName | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);

  const [currentPetHp, setCurrentPetHp] = useState<number | null>(null);
  const [currentPetSanity, setCurrentPetSanity] = useState<number | null>(null);


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
    const card = arsenalCards.find(card => card.id === editableCharacterData.selectedArsenalCardId) || null;
    if (card?.id?.startsWith('error-') || card?.id?.startsWith('warning-')) return null;
    return card;
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
        if (item.category?.toUpperCase() === 'GEAR' && item.parsedStatModifiers) {
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
    let weaponToDisplay: Weapon | undefined = editableCharacterData?.meleeWeapon
        ? { ...editableCharacterData.meleeWeapon }
        : { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" };

    if (equippedArsenalCard?.items) {
        const arsenalMeleeItem = equippedArsenalCard.items.find(item =>
            (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.parsedWeaponStats?.attack !== undefined)) &&
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
    if (equippedArsenalCard?.meleeAttackMod) {
        weaponToDisplay.attack = (weaponToDisplay.attack || 0) + equippedArsenalCard.meleeAttackMod;
    }
    if (weaponToDisplay.name === "Fists" && weaponToDisplay.attack === 1 && !editableCharacterData?.meleeWeapon?.name && !equippedArsenalCard?.meleeAttackMod && !equippedArsenalCard?.items.some(i => ((i.isFlaggedAsWeapon || i.category?.toUpperCase() === 'LOAD OUT') && i.parsedWeaponStats?.attack !== undefined && !(i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0)))) {
        return undefined;
    }

    return weaponToDisplay;
  }, [editableCharacterData?.meleeWeapon, equippedArsenalCard]);

  const currentRangedWeapon = useMemo(() => {
      let weaponToDisplay: RangedWeapon | undefined = editableCharacterData?.rangedWeapon
          ? { ...editableCharacterData.rangedWeapon }
          : { name: "None", attack: 0, range: 0, flavorText: "No ranged weapon" };

      if (equippedArsenalCard?.items) {
          const arsenalRangedItem = equippedArsenalCard.items.find(item =>
             (item.isFlaggedAsWeapon === true || (item.category?.toUpperCase() === 'LOAD OUT' && item.parsedWeaponStats?.attack !== undefined)) &&
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
      if (equippedArsenalCard) {
          weaponToDisplay.attack = (weaponToDisplay.attack || 0) + (equippedArsenalCard.rangedAttackMod || 0);
          weaponToDisplay.range = (weaponToDisplay.range || 0) + (equippedArsenalCard.rangedRangeMod || 0);
      }
    if (weaponToDisplay.name === "None" && weaponToDisplay.attack === 0 && weaponToDisplay.range === 0 && !editableCharacterData?.rangedWeapon?.name && !equippedArsenalCard?.rangedAttackMod && !equippedArsenalCard?.rangedRangeMod && !equippedArsenalCard?.items.some(i => ((i.isFlaggedAsWeapon || i.category?.toUpperCase() === 'LOAD OUT') && i.parsedWeaponStats?.attack !== undefined && (i.parsedWeaponStats?.range && i.parsedWeaponStats.range > 0)))) {
      return undefined;
    }

      return weaponToDisplay;
  }, [editableCharacterData?.rangedWeapon, equippedArsenalCard]);

  const currentCompanion = useMemo(() => {
    if (!equippedArsenalCard || !equippedArsenalCard.items) return null;
    return equippedArsenalCard.items.find(item => item.isPet === true) || null;
  }, [equippedArsenalCard]);

  useEffect(() => {
    if (currentCompanion && currentCompanion.parsedPetCoreStats) {
      setCurrentPetHp(currentCompanion.parsedPetCoreStats.maxHp ?? currentCompanion.parsedPetCoreStats.hp ?? null);
      setCurrentPetSanity(currentCompanion.parsedPetCoreStats.maxSanity ?? currentCompanion.parsedPetCoreStats.sanity ?? null);
    } else {
      setCurrentPetHp(null);
      setCurrentPetSanity(null);
    }
  }, [currentCompanion]);

  const abilitiesJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.abilities), [editableCharacterData?.abilities]);
  const savedCooldownsJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.savedCooldowns), [editableCharacterData?.savedCooldowns]);
  const savedQuantitiesJSONKey = useMemo(() => JSON.stringify(editableCharacterData?.savedQuantities), [editableCharacterData?.savedQuantities]);


  useEffect(() => {
    if (editableCharacterData && editableCharacterData.abilities) {
      const newMaxCDs: Record<string, number> = {};
      const newInitialCurrentCDs: Record<string, number> = {};
      const newMaxQTs: Record<string, number> = {};
      const newInitialCurrentQTs: Record<string, number> = {};

      const savedCDs = editableCharacterData.savedCooldowns;
      const savedQTs = editableCharacterData.savedQuantities;

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

  useEffect(() => {
    const fetchUserSavedCharacters = async () => {
      if (currentUser && auth.currentUser) {
        try {
          const charactersCollectionRef = collection(db, "userCharacters", auth.currentUser.uid, "characters");
          const querySnapshot = await getDocs(charactersCollectionRef);
          const savedChars = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Character));
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
      let finalName = templateChar.name;

      if (savedUserVersion) {
          if (templateChar.id === 'custom' && savedUserVersion.name && savedUserVersion.name !== templateChar.name) {
              displayLabel = `${savedUserVersion.name} (Custom Character)`;
              finalName = savedUserVersion.name;
          } else {
              displayLabel = `${templateChar.name} (Saved)`;
              finalName = savedUserVersion.name || templateChar.name;
          }
      } else if (templateChar.id === 'custom' && editableCharacterData?.id === 'custom' && editableCharacterData.name !== 'Custom Character') {
          // This case is tricky because characterDropdownOptions is global,
          // but editableCharacterData.name is specific to the current view.
          // For the dropdown itself, we should probably still show the template or saved name.
          // The CharacterHeader component handles displaying the *current* editable name.
      }
      
      return {
        id: templateChar.id,
        name: finalName, // This will be the name shown if loaded
        displayNameInDropdown: displayLabel, // This is purely for the dropdown text
      };
    }).sort((a, b) => a.displayNameInDropdown.localeCompare(b.displayNameInDropdown));
  }, [userSavedCharacters, charactersData]); // Removed editableCharacterData from here

 useEffect(() => {
    const loadCharacterData = async () => {
      if (!selectedCharacterId) {
        setIsLoadingCharacter(false);
        return;
      }

      setIsLoadingCharacter(true);
      if (setAuthError) setAuthError(null);

      let characterToLoad: Character | undefined = undefined;
      const defaultTemplate = charactersData.find(c => c.id === selectedCharacterId);

      if (selectedCharacterId === 'custom') {
        // Always load the default 'Custom Character' template first
        characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : undefined;
        if (characterToLoad) {
            characterToLoad.name = defaultTemplate?.name || 'Custom Character'; // Ensure it's template name
            characterToLoad.baseStats = { ...(defaultTemplate?.baseStats || initialCustomCharacterStats) };
            characterToLoad.skills = { ...(defaultTemplate?.skills || initialSkills) };
            characterToLoad.abilities = defaultTemplate?.abilities ? [...defaultTemplate.abilities] : [];
            characterToLoad.characterPoints = defaultTemplate?.characterPoints === undefined ? 375 : defaultTemplate.characterPoints;
            characterToLoad.selectedArsenalCardId = defaultTemplate?.selectedArsenalCardId || null;
             // Ensure savedCooldowns/Quantities are not loaded from template
            characterToLoad.savedCooldowns = {};
            characterToLoad.savedQuantities = {};
        }
        showToastHelper({ title: "Template Loaded", description: `Loaded default template for ${characterToLoad?.name}. Use 'Load My Saved Custom' to get your version.` });

      } else if (currentUser && auth.currentUser && defaultTemplate) {
        try {
          const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", selectedCharacterId);
          const docSnap = await getDoc(characterRef);

          if (docSnap.exists()) {
            characterToLoad = { id: selectedCharacterId, ...docSnap.data() } as Character;
            // Ensure all default fields are present if missing from saved data
            characterToLoad.name = characterToLoad.name || defaultTemplate.name;
            characterToLoad.baseStats = characterToLoad.baseStats || defaultTemplate.baseStats;
            characterToLoad.skills = characterToLoad.skills || defaultTemplate.skills;
            characterToLoad.abilities = Array.isArray(characterToLoad.abilities) ? characterToLoad.abilities : defaultTemplate.abilities;
            characterToLoad.characterPoints = typeof characterToLoad.characterPoints === 'number' ? characterToLoad.characterPoints : defaultTemplate.characterPoints;
            characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
            characterToLoad.meleeWeapon = characterToLoad.meleeWeapon || defaultTemplate.meleeWeapon;
            characterToLoad.rangedWeapon = characterToLoad.rangedWeapon || defaultTemplate.rangedWeapon;
            characterToLoad.imageUrl = characterToLoad.imageUrl || defaultTemplate.imageUrl;
            characterToLoad.avatarSeed = characterToLoad.avatarSeed || defaultTemplate.avatarSeed;
            characterToLoad.savedCooldowns = characterToLoad.savedCooldowns || {};
            characterToLoad.savedQuantities = characterToLoad.savedQuantities || {};
            showToastHelper({ title: "Character Loaded", description: `Loaded saved version of ${characterToLoad.name}.` });
          } else {
            characterToLoad = defaultTemplate ? JSON.parse(JSON.stringify(defaultTemplate)) : undefined;
            if (characterToLoad) {
                characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
                characterToLoad.savedCooldowns = {}; // Ensure fresh start
                characterToLoad.savedQuantities = {};
            }
            showToastHelper({ title: "Default Loaded", description: `Loaded default template for ${characterToLoad?.name}. No saved data found.` });
          }
        } catch (err: any) {
          console.error("Error loading character from Firestore:", err);
          showToastHelper({ title: "Load Failed", description: "Could not load saved data. Loading default template.", variant: "destructive" });
          if (defaultTemplate) {
            characterToLoad = JSON.parse(JSON.stringify(defaultTemplate));
             if (characterToLoad) {
                characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
                characterToLoad.savedCooldowns = {}; // Ensure fresh start
                characterToLoad.savedQuantities = {};
            }
          }
        }
      } else if (defaultTemplate) {
        characterToLoad = JSON.parse(JSON.stringify(defaultTemplate));
         if (characterToLoad) {
            characterToLoad.selectedArsenalCardId = characterToLoad.selectedArsenalCardId || null;
            characterToLoad.savedCooldowns = {}; // Ensure fresh start
            characterToLoad.savedQuantities = {};
        }
      }

      if (characterToLoad && !characterToLoad.skills) { // Should be redundant now
        characterToLoad.skills = { ...initialSkills };
      }
      
      if (characterToLoad) {
        setEditableCharacterData(characterToLoad);
      } else {
        setEditableCharacterData(null); 
        showToastHelper({ title: "Error", description: "Could not load character data.", variant: "destructive" });
      }
      setAbilityToAddId(undefined);
      setSkillToPurchase(undefined);
      setIsLoadingCharacter(false);
    };

    loadCharacterData();
  }, [selectedCharacterId, currentUser, setAuthError, showToastHelper]);


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

  const handleIncrementPetStat = (statType: 'hp' | 'sanity') => {
    if (!currentCompanion || !currentCompanion.parsedPetCoreStats) return;
    if (statType === 'hp') {
      const maxHp = currentCompanion.parsedPetCoreStats.maxHp ?? currentCompanion.parsedPetCoreStats.hp ?? 0;
      setCurrentPetHp(prev => Math.min((prev ?? 0) + 1, maxHp));
    } else if (statType === 'sanity') {
      const maxSanity = currentCompanion.parsedPetCoreStats.maxSanity ?? currentCompanion.parsedPetCoreStats.sanity ?? 0;
      setCurrentPetSanity(prev => Math.min((prev ?? 0) + 1, maxSanity));
    }
  };

  const handleDecrementPetStat = (statType: 'hp' | 'sanity') => {
    if (!currentCompanion || !currentCompanion.parsedPetCoreStats) return;
    if (statType === 'hp') {
      setCurrentPetHp(prev => Math.max((prev ?? 0) - 1, 0));
    } else if (statType === 'sanity') {
      setCurrentPetSanity(prev => Math.max((prev ?? 0) - 1, 0));
    }
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

    if (currentVal <= 1) { // Check if current value is already at the minimum of 1
      showToastHelper({ title: "Min Reached", description: `${statKey.toUpperCase()} cannot go below 1.`, variant: "destructive" });
      return;
    }

    setEditableCharacterData(prev => {
      if (!prev) return null;
      const newStats = { ...prev.baseStats };
      const costToRefund = customStatPointBuyConfig[statKey].cost;
      newStats[statKey] = currentVal - 1;
      if (statKey === 'hp') newStats.maxHp = Math.max(1, currentVal - 1);
      if (statKey === 'sanity') newStats.maxSanity = Math.max(1, currentVal - 1);

      return {
        ...prev,
        baseStats: newStats,
        characterPoints: currentPoints + costToRefund,
      };
    });
  };

  const [currentAbilityCooldowns, setCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [maxAbilityCooldowns, setMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [currentAbilityQuantities, setCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [maxAbilityQuantities, setMaxAbilityQuantities] = useState<Record<string, number>>({});


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
            characterToSet.name = charactersData.find(c => c.id === 'custom')?.name || 'Custom Character';
            characterToSet.baseStats = { ...initialCustomCharacterStats };
            characterToSet.skills = { ...initialSkills };
            characterToSet.abilities = [];
            characterToSet.characterPoints = charactersData.find(c => c.id === 'custom')?.characterPoints || 375;
        }
        characterToSet.selectedArsenalCardId = null;
         // Clear saved cooldowns and quantities on reset
        characterToSet.savedCooldowns = {};
        characterToSet.savedQuantities = {};
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
    const abilityCost = abilityInfo.cost ?? 0; // Ensure cost is a number

    if (currentCP < abilityCost) {
        showToastHelper({ title: "Not Enough CP", description: `You need ${abilityCost} CP to add ${abilityInfo.name}. You have ${currentCP}.`, variant: "destructive" });
        return;
    }
    
    const abilityNameForToast = abilityInfo.name; // Store for use in setTimeout

    setEditableCharacterData(prevData => {
        if (!prevData) return null;
        const { cost, ...abilityToAdd } = abilityInfo; // Destructure cost out
        const newAbilities = [...prevData.abilities, abilityToAdd as Ability]; // Add ability without cost prop
        const newCharacterPoints = currentCP - abilityCost;
        return { ...prevData, abilities: newAbilities, characterPoints: newCharacterPoints };
    });
     showToastHelper({ title: "Ability Added", description: `${abilityNameForToast} added to Custom Character for ${abilityCost} CP.` });
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
    if (currentLevel === 3) refund = SKILL_COST_LEVEL_3;
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
      return skillDefinitions.filter(def => (editableCharacterData.skills?.[def.id as SkillName] || 0) > 0);
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
      const characterToSave: Character = { 
        ...editableCharacterData,
        savedCooldowns: currentAbilityCooldowns,
        savedQuantities: currentAbilityQuantities,
        selectedArsenalCardId: editableCharacterData.selectedArsenalCardId || null,
      };
      const characterRef = doc(db, "userCharacters", currentUser.uid, "characters", editableCharacterData.id);
      await setDoc(characterRef, characterToSave, { merge: true });
      showToastHelper({ title: "Character Saved!", description: `${editableCharacterData.name} has been saved successfully.` });

      const charactersCollectionRef = collection(db, "userCharacters", currentUser.uid, "characters");
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

        const freshDefault = JSON.parse(JSON.stringify(defaultCustomTemplate));

        // Merge saved data with defaults, prioritizing saved data
        savedData.name = savedData.name || freshDefault.name;
        savedData.baseStats = { ...freshDefault.baseStats, ...savedData.baseStats };
        savedData.skills = { ...freshDefault.skills, ...savedData.skills };
        savedData.abilities = Array.isArray(savedData.abilities) ? savedData.abilities : [...freshDefault.abilities];
        savedData.characterPoints = typeof savedData.characterPoints === 'number' ? savedData.characterPoints : freshDefault.characterPoints;
        savedData.selectedArsenalCardId = savedData.selectedArsenalCardId || null;
        savedData.meleeWeapon = savedData.meleeWeapon || freshDefault.meleeWeapon;
        savedData.rangedWeapon = savedData.rangedWeapon || freshDefault.rangedWeapon;
        savedData.imageUrl = savedData.imageUrl || freshDefault.imageUrl;
        savedData.avatarSeed = savedData.avatarSeed || freshDefault.avatarSeed;
        savedData.savedCooldowns = savedData.savedCooldowns || {}; // Important
        savedData.savedQuantities = savedData.savedQuantities || {}; // Important

        setEditableCharacterData(JSON.parse(JSON.stringify(savedData))); // Deep copy to ensure new reference
        showToastHelper({ title: "Character Loaded", description: `Loaded your saved custom character: ${savedData.name}.` });
      } else {
        showToastHelper({ title: "Not Found", description: "No saved custom character found. Loaded default template.", variant: "destructive" });
        const defaultTemplate = charactersData.find(c => c.id === 'custom');
        if (defaultTemplate) {
            let characterToSet = JSON.parse(JSON.stringify(defaultTemplate));
            characterToSet.name = defaultTemplate.name || 'Custom Character';
            characterToSet.baseStats = { ...initialCustomCharacterStats };
            characterToSet.skills = { ...initialSkills };
            characterToSet.abilities = [];
            characterToSet.characterPoints = defaultTemplate.characterPoints || 375;
            characterToSet.selectedArsenalCardId = null;
            characterToSet.savedCooldowns = {};
            characterToSet.savedQuantities = {};
            setEditableCharacterData(characterToSet);
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

  const criticalArsenalError = arsenalCards.find(card => card.id === 'error-critical-arsenal');


  if (authLoading || isLoadingCharacter || !editableCharacterData) {
    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl p-10 text-center">
            <CardTitle className="text-3xl">Loading Character Data...</CardTitle>
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
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stats">Stats &amp; Equipment</TabsTrigger>
              <TabsTrigger value="arsenal">Arsenal</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-6 space-y-6">
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
                {/* Equipped Companion Display */}
                {currentCompanion && (
                  <>
                    <Separator />
                    <div className="p-4 rounded-lg border border-border bg-card/50 shadow-md">
                        <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <PawPrint className="mr-2 h-6 w-6 text-primary" /> Equipped Companion: {currentCompanion.petName || currentCompanion.abilityName || 'Unnamed Companion'}
                        </h3>
                        
                        {currentCompanion.petStats && (
                             <p className="text-sm text-muted-foreground mb-3">Raw Stats: {currentCompanion.petStats}</p>
                        )}

                        {currentCompanion.parsedPetCoreStats && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {currentCompanion.parsedPetCoreStats.maxHp !== undefined && currentPetHp !== null && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="flex items-center text-sm font-medium">
                                                <UserCircle className="mr-2 h-4 w-4 text-red-500" /> HP
                                            </Label>
                                            <div className="flex items-center gap-1">
                                                <Button variant="outline" size="icon" onClick={() => handleDecrementPetStat('hp')} className="h-6 w-6">
                                                    <UserMinus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={currentPetHp}
                                                    readOnly
                                                    className="w-12 h-6 text-center text-sm font-bold p-1"
                                                />
                                                <Button variant="outline" size="icon" onClick={() => handleIncrementPetStat('hp')} className="h-6 w-6">
                                                    <UserPlus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Progress value={(currentPetHp / (currentCompanion.parsedPetCoreStats.maxHp || 1)) * 100} className="h-1.5 [&>div]:bg-red-500" />
                                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetHp} / {currentCompanion.parsedPetCoreStats.maxHp}</p>
                                    </div>
                                )}
                                {currentCompanion.parsedPetCoreStats.maxSanity !== undefined && currentPetSanity !== null && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="flex items-center text-sm font-medium">
                                                <UserCircle className="mr-2 h-4 w-4 text-blue-400" /> Sanity
                                            </Label>
                                            <div className="flex items-center gap-1">
                                                <Button variant="outline" size="icon" onClick={() => handleDecrementPetStat('sanity')} className="h-6 w-6">
                                                    <UserMinus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={currentPetSanity}
                                                    readOnly
                                                    className="w-12 h-6 text-center text-sm font-bold p-1"
                                                />
                                                <Button variant="outline" size="icon" onClick={() => handleIncrementPetStat('sanity')} className="h-6 w-6">
                                                    <UserPlus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Progress value={(currentPetSanity / (currentCompanion.parsedPetCoreStats.maxSanity || 1)) * 100} className="h-1.5 [&>div]:bg-blue-400" />
                                        <p className="text-xs text-muted-foreground text-right mt-0.5">{currentPetSanity} / {currentCompanion.parsedPetCoreStats.maxSanity}</p>
                                    </div>
                                )}
                                {currentCompanion.parsedPetCoreStats.mv !== undefined && (
                                    <div className="flex items-center justify-between text-sm col-span-1 md:col-span-2 pt-2">
                                        <Label className="flex items-center font-medium">
                                            <UserCircle className="mr-2 h-4 w-4 text-green-500" /> MV
                                        </Label>
                                        <span className="font-semibold">{currentCompanion.parsedPetCoreStats.mv}</span>
                                    </div>
                                )}
                                {currentCompanion.parsedPetCoreStats.def !== undefined && (
                                    <div className="flex items-center justify-between text-sm col-span-1 md:col-span-2">
                                        <Label className="flex items-center font-medium">
                                            <UserCircle className="mr-2 h-4 w-4 text-gray-400" /> DEF
                                        </Label>
                                        <span className="font-semibold">{currentCompanion.parsedPetCoreStats.def}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {currentCompanion.petAbilities && (
                            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-muted-foreground/20">
                                <strong className="text-foreground">Abilities:</strong> {currentCompanion.petAbilities}
                            </p>
                        )}
                    </div>
                  </>
                )}
            </TabsContent>

            <TabsContent value="arsenal" className="mt-6 space-y-6">
                <ArsenalTabContent
                    editableCharacterData={editableCharacterData}
                    arsenalCards={arsenalCards}
                    handleArsenalCardChange={handleArsenalCardChange}
                    currentCompanion={currentCompanion}
                    currentPetHp={currentPetHp} // Pass currentPetHp
                    currentPetSanity={currentPetSanity} // Pass currentPetSanity
                    handleIncrementPetStat={handleIncrementPetStat} // Pass handler
                    handleDecrementPetStat={handleDecrementPetStat} // Pass handler
                    criticalArsenalError={criticalArsenalError}
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

