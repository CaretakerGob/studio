
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Footprints, Shield, Brain, Swords, UserCircle, Minus, Plus, Save, RotateCcw, BookOpen, Zap, ShieldAlert, Crosshair, ClipboardList, Leaf, Library, BookMarked, HeartHandshake, SlidersHorizontal, Award, Clock, Box } from "lucide-react";
import type { CharacterStats, CharacterStatDefinition, StatName, Character, Ability, Weapon, RangedWeapon, Skills, SkillName, SkillDefinition } from "@/types/character";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';


const initialBaseStats: Omit<CharacterStats, 'atk' | 'rng'> = {
  hp: 10, maxHp: 10,
  mv: 3,
  def: 2,
  sanity: 8, maxSanity: 8,
};

const initialSkills: Skills = {
  tactics: 0,
  survival: 0,
  knowledge: 0,
  occult: 0,
  empathy: 0,
  tuner: 0,
};

const statDefinitions: CharacterStatDefinition[] = [
  { id: 'hp', label: "Health Points (HP)", icon: Heart, description: "Your character's vitality. Reaching 0 HP usually means defeat." },
  { id: 'sanity', label: "Sanity", icon: Brain, description: "Your character's mental stability. Low sanity can have dire consequences." },
  { id: 'mv', label: "Movement (MV)", icon: Footprints, description: "How many spaces your character can move." },
  { id: 'def', label: "Defense (DEF)", icon: Shield, description: "Reduces incoming damage." },
];

const skillDefinitions: SkillDefinition[] = [
  { id: 'tactics', label: "Tactics", icon: ClipboardList, description: "Governs strategic planning and combat effectiveness." },
  { id: 'survival', label: "Survival", icon: Leaf, description: "Represents wilderness survival, tracking, and foraging." },
  { id: 'knowledge', label: "Knowledge", icon: Library, description: "Measures understanding of lore, rituals, and general information." },
  { id: 'occult', label: "Occult (Occ)", icon: BookMarked, description: "Understanding of forbidden lore, supernatural entities, and dark rituals." },
  { id: 'empathy', label: "Empathy (Emp)", icon: HeartHandshake, description: "Ability to understand and influence the emotions and intentions of others." },
  { id: 'tuner', label: "Tuner (Tun)", icon: SlidersHorizontal, description: "Special ability to manipulate game mechanics or reality to a certain extent." },
];

const charactersData: Character[] = [
  {
    id: 'custom',
    name: 'Custom Character',
    baseStats: initialBaseStats,
    skills: initialSkills,
    abilities: [],
    avatarSeed: 'customcharacter',
    meleeWeapon: { name: "Fists", attack: 1, flavorText: "Basic unarmed attack" },
    rangedWeapon: { name: "Thrown Rock", attack: 1, range: 3, flavorText: "A hastily thrown rock" },
    characterPoints: 0,
  },
  {
    id: 'gob',
    name: 'Gob',
    baseStats: { hp: 7, maxHp: 7, mv: 4, def: 3, sanity: 4, maxSanity: 4 },
    skills: { tactics: 3, survival: 2, knowledge: 3, occult: 0, empathy: 0, tuner: 0 },
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
    skills: { tactics: 0, survival: 0, knowledge: 0, occult: 2, empathy: 2, tuner: 1 },
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
];


export function CharacterSheetUI() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(charactersData[0].id);
  const [stats, setStats] = useState<CharacterStats>(charactersData.find(c => c.id === charactersData[0].id)?.baseStats || initialBaseStats);
  const [characterSkills, setCharacterSkills] = useState<Skills>(charactersData.find(c => c.id === charactersData[0].id)?.skills || initialSkills);
  const [highlightedStat, setHighlightedStat] = useState<StatName | null>(null);
  
  const [currentAbilityCooldowns, setCurrentAbilityCooldowns] = useState<Record<string, number>>({});
  const [maxAbilityCooldowns, setMaxAbilityCooldowns] = useState<Record<string, number>>({});
  const [currentAbilityQuantities, setCurrentAbilityQuantities] = useState<Record<string, number>>({});
  const [maxAbilityQuantities, setMaxAbilityQuantities] = useState<Record<string, number>>({});


  const selectedCharacter = charactersData.find(c => c.id === selectedCharacterId) || charactersData[0];

  const parseCooldownRounds = useCallback((cooldownString?: string): number | undefined => {
    if (!cooldownString) return undefined;
    const match = cooldownString.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }, []);

  useEffect(() => {
    if (selectedCharacter) {
      setStats(selectedCharacter.baseStats);
      setCharacterSkills(selectedCharacter.skills || initialSkills);

      const newCurrentCooldowns: Record<string, number> = {};
      const newMaxCooldowns: Record<string, number> = {};
      const newCurrentQuantities: Record<string, number> = {};
      const newMaxQuantities: Record<string, number> = {};

      selectedCharacter.abilities.forEach(ability => {
        if (ability.cooldown && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          const maxRounds = parseCooldownRounds(ability.cooldown);
          if (maxRounds !== undefined) {
            newMaxCooldowns[ability.id] = maxRounds;
            newCurrentCooldowns[ability.id] = maxRounds; 
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          newMaxQuantities[ability.id] = ability.maxQuantity;
          newCurrentQuantities[ability.id] = ability.maxQuantity;
        }
      });
      setCurrentAbilityCooldowns(newCurrentCooldowns);
      setMaxAbilityCooldowns(newMaxCooldowns);
      setCurrentAbilityQuantities(newCurrentQuantities);
      setMaxAbilityQuantities(newMaxQuantities);
    }
  }, [selectedCharacter, parseCooldownRounds]);

  const handleCharacterChange = (id: string) => {
    setSelectedCharacterId(id);
  };

  const handleStatChange = (statName: StatName, value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numericValue)) return;

    setStats(prevStats => {
      const newStats = { ...prevStats, [statName]: numericValue };
      if (statName === 'hp') newStats.hp = Math.max(0, Math.min(numericValue, newStats.maxHp));
      if (statName === 'maxHp') newStats.maxHp = Math.max(0, numericValue);
      if (statName === 'sanity') newStats.sanity = Math.max(0, Math.min(numericValue, newStats.maxSanity));
      if (statName === 'maxSanity') newStats.maxSanity = Math.max(0, numericValue);
      return newStats;
    });

    setHighlightedStat(statName);
    setTimeout(() => setHighlightedStat(null), 300);
  };
  
  const incrementStat = (statName: StatName) => {
    handleStatChange(statName, (stats[statName] || 0) + 1);
  };

  const decrementStat = (statName: StatName) => {
    handleStatChange(statName, (stats[statName] || 0) - 1);
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
    if (selectedCharacter) {
      setStats(selectedCharacter.baseStats);
      setCharacterSkills(selectedCharacter.skills || initialSkills);
      const newCurrentCooldowns: Record<string, number> = {};
      const newCurrentQuantities: Record<string, number> = {};
      selectedCharacter.abilities.forEach(ability => {
        if ((ability.type === 'Action' || ability.type === 'Interrupt') && ability.cooldown) {
          const maxRounds = parseCooldownRounds(ability.cooldown);
          if (maxRounds !== undefined) {
            newCurrentCooldowns[ability.id] = maxRounds; 
          }
        }
        if (ability.maxQuantity !== undefined && (ability.type === 'Action' || ability.type === 'Interrupt')) {
          newCurrentQuantities[ability.id] = ability.maxQuantity;
        }
      });
      setCurrentAbilityCooldowns(newCurrentCooldowns);
      setCurrentAbilityQuantities(newCurrentQuantities);
    }
  };

  const StatInputComponent: React.FC<{ def: CharacterStatDefinition }> = ({ def }) => {
    const isProgressStat = def.id === 'hp' || def.id === 'sanity';
    const currentValue = stats[def.id] || 0;
    const maxValue = def.id === 'hp' ? stats.maxHp : (def.id === 'sanity' ? stats.maxSanity : undefined);

    return (
      <div className={cn("p-4 rounded-lg border border-border bg-card/50 transition-all duration-300", highlightedStat === def.id ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
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
                        min="0"
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
    const skillValue = characterSkills[def.id] || 0;
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

  const abilities = selectedCharacter.abilities;
  const actionAbilities = abilities.filter(a => a.type === 'Action');
  const interruptAbilities = abilities.filter(a => a.type === 'Interrupt');
  const passiveAbilities = abilities.filter(a => a.type === 'Passive');

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

    const hasTrackableCooldown = !hasTrackableQuantity && // Prioritize quantity display if both defined
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

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl relative overflow-hidden">
      {selectedCharacter.imageUrl && (
        <Image
          src={selectedCharacter.imageUrl}
          alt={`${selectedCharacter.name} background`}
          fill
          style={{ objectFit: 'contain', objectPosition: 'center top' }} 
          className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
          priority
          data-ai-hint="character background"
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
            <div className="md:col-span-1 space-y-4 flex flex-col items-center">
              <div className="w-full max-w-xs">
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
              
              {!selectedCharacter.imageUrl && selectedCharacter.avatarSeed && (
                  <Avatar className="w-48 h-48 rounded-lg border-2 border-primary shadow-lg mt-4">
                      <AvatarFallback className="text-6xl bg-muted text-muted-foreground">
                          {selectedCharacter.name.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                  </Avatar>
              )}
            </div>
          
            <div className="md:col-span-2 space-y-4 flex justify-end">
              {selectedCharacter && selectedCharacter.characterPoints !== undefined && (
                <div className="p-3 rounded-lg border border-border bg-card/50 shadow-md w-fit flex flex-col items-end">
                  <Label className="text-md font-medium flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Character Points
                  </Label>
                  <p className="text-xl font-bold text-primary mt-1">
                    {selectedCharacter.characterPoints}
                  </p>
                </div>
              )}
            </div>
          </div>
          <Separator />


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
                      <WeaponDisplay weapon={selectedCharacter.meleeWeapon} type="melee" />
                      <WeaponDisplay weapon={selectedCharacter.rangedWeapon} type="ranged" />
                  </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><Library className="mr-2 h-6 w-6 text-primary" /> Skills</h3>
                {
                  (() => {
                    const relevantSkillDefinitions = skillDefinitions.filter(def => (characterSkills[def.id] || 0) > 0);
                    if (relevantSkillDefinitions.length === 0 && selectedCharacter.id !== 'custom') { // Show for custom, hide for others if no skills
                      return <p className="text-muted-foreground text-center py-4 bg-card/50 rounded-md">This character has no specialized skills.</p>;
                    }
                    if (selectedCharacter.id === 'custom' && relevantSkillDefinitions.length === 0) {
                       // Potentially allow adding/editing skills for custom characters in future
                       return <p className="text-muted-foreground text-center py-4 bg-card/50 rounded-md">Define custom skills for this character.</p>;
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
              {abilities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 bg-card/50 rounded-md">This character has no special abilities defined.</p>
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

    
