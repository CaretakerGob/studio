
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
import { Heart, Footprints, Shield, Brain, Swords, UserCircle, Minus, Plus, Save, RotateCcw, BookOpen, Zap, ShieldAlert, Crosshair, ClipboardList, Leaf, Library, BookMarked, HeartHandshake, SlidersHorizontal, Award, Clock, Box, VenetianMask, Search, PersonStanding, Laptop, Star, Wrench, Smile, ShoppingCart } from "lucide-react";
import type { CharacterStats, CharacterStatDefinition, StatName, Character, Ability, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition } from "@/types/character";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";


const initialBaseStats: CharacterStats = {
  hp: 5, maxHp: 5,
  mv: 2,
  def: 2,
  sanity: 5, maxSanity: 5,
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
    baseStats: { hp: 5, maxHp: 5, mv: 2, def: 2, sanity: 5, maxSanity: 5 },
    skills: { ...initialSkills },
    abilities: [],
    avatarSeed: 'customcharacter',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FCharacters%20no%20BG%2FCustom%20Character%20silhouette.png?alt=media&token=2b64a81c-42cf-4f1f-82ac-01b9ceae863b',
    meleeWeapon: { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" },
    rangedWeapon: { name: "Thrown Rock", attack: 1, range: 3, flavorText: "A hastily thrown rock" },
    characterPoints: 375, 
  },
  {
    id: 'gob',
    name: 'Gob',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 4, maxSanity: 4 },
    skills: { ...initialSkills, tac: 3, sur: 2, kno: 3, ath: 0, cpu: 0, dare: 0, dec: 0, emp: 0, eng: 0, inv: 0, occ: 0, pers: 0, tun: 0 },
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


export function CharacterSheetUI() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [editableCharacterData, setEditableCharacterData] = useState<Character | null>(null);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  const [abilityToAddId, setAbilityToAddId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const stats = useMemo(() => editableCharacterData?.baseStats || initialBaseStats, [editableCharacterData]);
  const characterSkills = useMemo(() => editableCharacterData?.skills || initialSkills, [editableCharacterData]);
  
  const [currentAbilityCooldowns, setCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [maxAbilityCooldowns, setMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [currentAbilityQuantities, setCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [maxAbilityQuantities, setMaxAbilityQuantities] = useState<Record<string, number>>({});

  const parseCooldownRounds = useCallback((cooldownString?: string): number | undefined => {
    if (!cooldownString) return undefined;
    const match = cooldownString.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }, []);

  useEffect(() => {
    const character = charactersData.find(c => c.id === selectedCharacterId);
    if (character) {
      setEditableCharacterData(JSON.parse(JSON.stringify(character)));
    }
  }, [selectedCharacterId]);

  useEffect(() => {
    if (editableCharacterData) {
      const newMaxCDs: Record<string, number> = {};
      const newInitialCurrentCDs: Record<string, number> = {};
      const newMaxQTs: Record<string, number> = {};
      const newInitialCurrentQTs: Record<string, number> = {};

      (editableCharacterData.abilities || []).forEach(ability => {
        if (ability.cooldown && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          const maxRounds = parseCooldownRounds(ability.cooldown);
          if (maxRounds !== undefined) {
            newMaxCDs[ability.id] = maxRounds;
            newInitialCurrentCDs[ability.id] = maxRounds; // Initialize to max
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          newMaxQTs[ability.id] = ability.maxQuantity;
          newInitialCurrentQTs[ability.id] = ability.maxQuantity; // Initialize to max
        }
      });

      setMaxAbilityCooldowns(newMaxCDs);
      setCurrentAbilityCooldowns(newInitialCurrentCDs);
      setMaxAbilityQuantities(newMaxQTs);
      setCurrentAbilityQuantities(newInitialCurrentQTs);
    } else {
      // If no character data, clear the trackers
      setMaxAbilityCooldowns({});
      setCurrentAbilityCooldowns({});
      setMaxAbilityQuantities({});
      setCurrentAbilityQuantities({});
    }
  }, [editableCharacterData, parseCooldownRounds]);


  const handleCharacterChange = (id: string) => {
    setSelectedCharacterId(id);
    setAbilityToAddId(undefined);
  };

  const handleStatChange = (statName: StatName, value: number | string) => {
    if (!editableCharacterData) return;
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
     if (!editableCharacterData) return;
     const currentStats = editableCharacterData.baseStats;
     if (statName === 'hp' && currentStats.hp >= currentStats.maxHp) return;
     if (statName === 'sanity' && currentStats.sanity >= currentStats.maxSanity) return;
    handleStatChange(statName, (currentStats[statName] || 0) + 1);
  };

  const decrementStat = (statName: StatName) => {
    if (!editableCharacterData) return;
    handleStatChange(statName, (editableCharacterData.baseStats[statName] || 0) - 1);
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
    const originalCharacter = charactersData.find(c => c.id === selectedCharacterId);
    if (originalCharacter) {
      setEditableCharacterData(JSON.parse(JSON.stringify(originalCharacter))); 
       toast({ title: "Stats Reset", description: `${originalCharacter.name}'s stats and abilities have been reset to default.` });
    }
  };

  const handleAddAbilityToCustomCharacter = () => {
    if (!editableCharacterData || editableCharacterData.id !== 'custom' || !abilityToAddId) return;

    const abilityInfo = allUniqueAbilities.find(a => a.id === abilityToAddId);
    if (!abilityInfo) {
        toast({ title: "Error", description: "Selected ability not found.", variant: "destructive" });
        return;
    }
    
    if (editableCharacterData.abilities.some(a => a.id === abilityInfo.id)) {
        toast({ title: "Ability Exists", description: `${abilityInfo.name} is already added.`, variant: "destructive" });
        return;
    }

    if ((editableCharacterData.characterPoints || 0) < abilityInfo.cost) {
        toast({ title: "Not Enough CP", description: `You need ${abilityInfo.cost} CP to add ${abilityInfo.name}. You have ${editableCharacterData.characterPoints || 0}.`, variant: "destructive" });
        return;
    }

    setEditableCharacterData(prevData => {
        if (!prevData) return null;
        const { cost, ...abilityToAdd } = abilityInfo; 
        const newAbilities = [...prevData.abilities, abilityToAdd];
        const newCharacterPoints = (prevData.characterPoints || 0) - cost;
        
        toast({ title: "Ability Added", description: `${abilityInfo.name} added to Custom Character for ${cost} CP.` });
        return { ...prevData, abilities: newAbilities, characterPoints: newCharacterPoints };
    });
    setAbilityToAddId(undefined); 
  };


  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = stats[def.id] || 0;
    const maxValue = def.id === 'hp' ? stats.maxHp : (def.id === 'sanity' ? stats.maxSanity : undefined);

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
    if (!weapon || weapon.name === "None") return null;
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

  if (!editableCharacterData) {
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
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Stats
              </Button>
          </div>
          <CardDescription>Manage your character's attributes, abilities, and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 space-y-4">
              <div className="w-full">
                <Label htmlFor="characterName" className="text-lg font-medium mb-1 block">Character</Label>
                <Select value={selectedCharacterId} onValueChange={handleCharacterChange}>
                  <SelectTrigger id="characterName" className="text-xl p-2 w-full">
                    <SelectValue placeholder="Select a character" />
                  </SelectTrigger>
                  <SelectContent>
                    {charactersData.map(char => (
                      <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-lg bg-card/30">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" /> Custom Ability Selection
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                <div className="w-full">
                  <Label htmlFor="abilitySelect" className="text-sm text-muted-foreground">Choose an ability to add:</Label>
                  <Select value={abilityToAddId} onValueChange={setAbilityToAddId}>
                    <SelectTrigger id="abilitySelect">
                      <SelectValue placeholder="Select an ability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Abilities</SelectLabel>
                        {allUniqueAbilities.map(ability => (
                          <SelectItem key={ability.id} value={ability.id} disabled={(editableCharacterData.characterPoints || 0) < ability.cost || editableCharacterData.abilities.some(a => a.id === ability.id)}>
                            {ability.name} ({ability.type}) - {ability.cost} CP
                          </SelectItem>
                        ))}
                      </SelectGroup>
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
              <p className="text-xs text-muted-foreground">
                Selected abilities will appear in the 'Abilities' tab below.
              </p>
            </div>
          )}


          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Stats &amp; Equipment</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary" /> Core Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {statDefinitions.map(def => <StatInputComponent key={def.id} def={def} />)}
                </div>
              </div>
              <Separator/>
              <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center"><Swords className="mr-2 h-6 w-6 text-primary" /> Weapons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WeaponDisplay weapon={editableCharacterData.meleeWeapon} type="melee" />
                      <WeaponDisplay weapon={editableCharacterData.rangedWeapon} type="ranged" />
                  </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><Library className="mr-2 h-6 w-6 text-primary" /> Skills</h3>
                {
                  (() => {
                    const relevantSkillDefinitions = skillDefinitions.filter(def => ((characterSkills as Skills)[def.id as SkillName] ?? 0) > 0 || editableCharacterData.id === 'custom'); 
                     
                    if (relevantSkillDefinitions.length === 0 && editableCharacterData.id !== 'custom') {
                      return <p className="text-muted-foreground text-center py-4 bg-card/50 rounded-md">This character has no specialized skills.</p>;
                    }
                    if (editableCharacterData.id === 'custom') {
                       return (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {skillDefinitions.map(def => <SkillDisplayComponent key={def.id} def={def} />)}
                         </div>
                       );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {relevantSkillDefinitions.map(def => <SkillDisplayComponent key={def.id} def={def} />)}
                      </div>
                    );
                  })()
                }
              </div>
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
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-5 w-5" /> Save Character (Demo)
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
