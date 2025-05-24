
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ShopItem } from '@/types/shop';
import { Store, ShoppingCart, Coins, ShieldAlert, Swords, Crosshair, WandSparkles, Construction, Droplets, HelpCircle, Zap, Flame, Bomb, Ambulance, BatteryCharging, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Placeholder for a comprehensive shop inventory.
const shopInventory: ShopItem[] = [
  // Defense Gear
  { id: 'def_riot_shield', name: 'Riot Shield', cost: 4, description: '-2 damage from Range Attacks.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'riot shield' },
  { id: 'def_body_armor', name: 'Body Armor', cost: 4, description: '-2 damage from Melee Attacks.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'body armor' },
  { id: 'def_helmet', name: 'Helmet', cost: 6, description: 'Lower damage received by Critical Hits by 2.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'helmet' },
  { id: 'def_riot_helm', name: 'Riot Helm', cost: 10, description: 'Lower damage received by Critical Hits by 3.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'riot helmet' },
  { id: 'def_cheap_kevlar', name: 'Cheap Kevlar', cost: 6, description: 'Reroll one defense dice. Wearer can no longer achieve Perfect Defense.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'kevlar vest' },
  { id: 'def_chain_vest', name: 'Chain Vest', cost: 6, description: 'Set Defense value to 3', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'chainmail vest' },
  { id: 'def_tactical_armor', name: 'Tactical Armor', cost: 10, description: 'Increase units with a natural Defense of 3 to 4.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'tactical vest' },
  { id: 'def_leather_armor', name: 'Leather Armor', cost: 6, description: 'Increase Max HP by 1', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'leather armor' },
  { id: 'def_studded_leather', name: 'Studded Leather', cost: 10, description: 'Increase Max HP by 2', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'studded leather' },
  { id: 'def_brown_coat', name: 'Brown Coat', cost: 6, description: '+1 to all Sanity Checks', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'trench coat' },
  { id: 'def_chest_plate', name: 'Chest Plate', cost: 10, description: 'Requires 2 more Bleed Points to HEMORRHAGE', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'metal breastplate' },
  { id: 'def_scale_armor', name: 'Scale Armor', cost: 10, description: 'Immune to WOUNDING', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'scale mail' },
  { id: 'def_rosary', name: 'Rosary', cost: 12, description: 'Immune to MAX HP damage', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rosary beads' },
  { id: 'def_flame_resistant', name: 'Flame Resistant', cost: 3, description: '-1 damage from FIRE', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fireproof suit' },
  { id: 'def_frost_resistant', name: 'Frost Resistant', cost: 3, description: '-1 damage from ICE', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'winter gear' },
  { id: 'def_shock_resistant', name: 'Shock Resistant', cost: 3, description: '-1 damage from ELEC', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rubber suit' },
  { id: 'def_flame_ward', name: 'Flame Ward', cost: 8, description: '-3 damage from FIRE; +2 from ICE', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fire amulet' },
  { id: 'def_frost_ward', name: 'Frost Ward', cost: 8, description: '-3 damage from ICE; +2 from ELEC', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ice amulet' },
  { id: 'def_shock_ward', name: 'Shock Ward', cost: 8, description: '-3 damage from ELEC; +2 from ICE', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'lightning amulet' },
  { id: 'def_flame_retardant', name: 'Flame Retardant', cost: 12, description: 'Immune to FIRE Status Effect', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'asbestos suit' },
  { id: 'def_frost_retardant', name: 'Frost Retardant', cost: 12, description: 'Immune to ICE Status Effect', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'thermal suit' },
  { id: 'def_shock_retardant', name: 'Shock Retardant', cost: 12, description: 'Immune to ELEC Status Effect', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'grounded suit' },
  { id: 'def_battery_packs', name: 'Battery Packs', cost: 6, description: 'Lowers cool down time of all Beam attacks by one.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'battery pack' },
  { id: 'def_grenade_belt', name: 'Grenade Belt', cost: 6, description: 'Lowers cool down time of all AOE attacks by one.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'grenade bandolier' },
  { id: 'def_wrist_sling', name: 'Wrist Sling', cost: 4, description: 'Immune to DISARM status effect', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'arm brace' },
  { id: 'def_sun_glasses', name: 'Sun Glasses', cost: 4, description: 'Immune to BLIND status effect', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sunglasses dark' },
  { id: 'def_pumps', name: 'Pumps', cost: 2, description: 'Movement +1 "Jump higher and move faster"', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'high heels' },
  { id: 'def_athletic_shoe', name: 'Athletic Shoe', cost: 6, description: 'Movement +2', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'running shoes' },
  { id: 'def_knee_pad', name: 'Knee Pad', cost: 6, description: 'INTERRUPT: Evasive roll - 2 space any direction - 1 round CD.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'knee pads' },
  { id: 'def_precision_scope', name: 'Precision Scope', cost: 8, description: 'Increase Range by 2', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rifle scope' },
  { id: 'def_thermal_scope', name: 'Thermal Scope', cost: 10, description: 'Ignore Stealth on targets when attacking', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'thermal vision' },
  { id: 'def_stealth_suit', name: 'Stealth Suit', cost: 15, description: 'Lower Range value of all enemy attacks by 2 when targeted', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'camo suit' },
  { id: 'def_utility_pouch', name: 'Utility Pouch', cost: 2, description: 'Increase max use of one Interrupt ability by 2', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'utility belt' },
  { id: 'def_utility_pouch_plus', name: 'Utility Pouch +1', cost: 6, description: 'Increase max use of one Interrupt ability by 3', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'large pouch' },
  { id: 'def_utility_pouch_holding', name: 'Utility Pouch of Holding', cost: 10, description: 'Choose one Interrupt, it is no longer consumed upon use but instead triggers a 2 round CD.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magic bag' },
  { id: 'def_thief_glove', name: "Thief's Glove", cost: 6, description: 'Character can make a free melee attack when stealing against an enemy.', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'leather glove' },
  { id: 'def_tin_foil_hat', name: 'Tin Foil Hat', cost: 2, description: 'The foil protects your head from the government .', category: 'Defense', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'tinfoil hat' },
  
  // Melee Weapons
  { id: 'melee_bat', name: 'Bat', cost: 2, weaponClass: 'Blunt', attack: 'A2', description: 'Standard bat. Blunt Class: Armor Breaker (PASSIVE) - Re-roll 1 of the targets Defense Dice.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'baseball bat' },
  { id: 'melee_crowbar', name: 'Crowbar', cost: 6, weaponClass: 'Blunt', attack: 'A3', description: 'Critical Hits inflict FLINCH for 1 turn. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'crowbar' },
  { id: 'melee_sledge_hammer', name: 'Sledge Hammer', cost: 10, weaponClass: 'Blunt', attack: 'A4', description: 'Heavy blunt weapon. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sledgehammer' },
  { id: 'melee_silver_mace', name: 'Silver Mace', cost: 13, weaponClass: 'Blunt', attack: 'A3', description: 'Treat as Silver. See Undying Template. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'silver mace' },
  { id: 'melee_mace', name: 'Mace', cost: 13, weaponClass: 'Blunt', attack: 'A5', description: 'Powerful mace. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'iron mace' },
  { id: 'melee_baton', name: 'Baton', cost: 8, weaponClass: 'Blunt', attack: 'A3', description: 'Critical Hits disarm target for 1 turn. 2 round CD upon success. Blunt Class: Armor Breaker.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'police baton' },
  { id: 'melee_wooden_stakes', name: 'Wooden Stakes', cost: 2, weaponClass: 'Exotic', attack: 'A2', description: 'Treat as a Stake. See Undying Template. Sharp Class: Damaged targets take 1 point of BLEED.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'wooden stakes' },
  { id: 'melee_holy_ash_stake', name: 'Holy Ash Stake', cost: 6, weaponClass: 'Exotic', attack: 'A2', description: 'Treat as a Stake. Double Damage when attacking Vampires and ignores the Undying Template for a any enemies with a Stake Weakness. This item is consumed if a Vampire is killed by it. Sharp Class: Damaged targets take 1 point of BLEED.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'holy stake' },
  { id: 'melee_keen_kukri', name: 'Keen Kukri', cost: 8, weaponClass: 'Exotic', attack: 'A3', description: 'Critical Hits inflict +1 BLEED point. Sharp Class: Damaged targets take 1 point of BLEED.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'kukri knife' },
  { id: 'melee_tri_dagger', name: 'Tri-dagger', cost: 13, weaponClass: 'Exotic', attack: 'A4', description: 'A three-bladed dagger. Sharp Class: Damaged targets take 1 point of BLEED.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'trident dagger' },
  { id: 'melee_falchion', name: 'Falchion', cost: 15, weaponClass: 'Exotic', attack: 'A5', description: 'A curved single-edged sword. Sharp Class: Damaged targets take 1 point of BLEED.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'falchion sword' },
  { id: 'melee_broadsword', name: 'Broadsword', cost: 4, weaponClass: 'Large', attack: 'A3', description: 'Critical Hits inflict FLINCH for 1 turn. Menacing Class: Non-Base template targets roll 1 less Defense.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'broadsword' },
  { id: 'melee_battle_axe', name: 'Battle Axe', cost: 7, weaponClass: 'Large', attack: 'A4', description: 'Make a second attack against adjacent enemy. Menacing Class: Non-Base template targets roll 1 less Defense.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'battle axe' },
  { id: 'melee_claymore', name: 'Claymore', cost: 11, weaponClass: 'Large', attack: 'A5', description: 'A large two-handed sword. Menacing Class: Non-Base template targets roll 1 less Defense.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'claymore sword' },
  { id: 'melee_buster_sword', name: 'Buster Sword', cost: 15, weaponClass: 'Large', attack: 'A6', description: 'Cannot use an Interrupt the same turn as attacking with this weapon. Menacing Class: Non-Base template targets roll 1 less Defense.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'giant sword' },
  { id: 'melee_epee', name: 'Epee', cost: 4, weaponClass: 'Nimble', attack: 'A2', description: 'Fencing sword. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'epee sword' },
  { id: 'melee_rapier', name: 'Rapier', cost: 8, weaponClass: 'Nimble', attack: 'A3', description: 'Critical Hit inflict 1 point of BLEED. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rapier sword' },
  { id: 'melee_silver_saber', name: 'Silver Saber', cost: 12, weaponClass: 'Nimble', attack: 'A3', description: 'Treat as Silver. See Undying Template. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'silver saber' },
  { id: 'melee_saber', name: 'Saber', cost: 12, weaponClass: 'Nimble', attack: 'A4', description: 'Curved slashing sword. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'saber sword' },
  { id: 'melee_bowie_knife', name: 'Bowie Knife', cost: 6, weaponClass: 'Nimble', attack: 'A2', description: 'If this weapon triggers a Critical Hit you can attack again. Can trigger once per turn. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'bowie knife' },
  { id: 'melee_elite_tactical_knife', name: 'Elite Tactical Knife', cost: 12, weaponClass: 'Nimble', attack: 'A4', description: 'If this weapon triggers a Critical Hit you can attack again. Can trigger once per turn. Quick Strike Class: Make a Melee Attack with this weapon as an Interrupt.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'tactical knife' },
  { id: 'melee_spade', name: 'Spade', cost: 2, weaponClass: 'Polearm', attack: 'A2/R2', description: 'Can be used as a shovel. First Strike Class: MULTI-ATTACK, can only target enemies at Range 2.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'spade shovel' },
  { id: 'melee_spear', name: 'Spear', cost: 6, weaponClass: 'Polearm', attack: 'A3/R2', description: 'Critical Hit inflict 1 point of BLEED. First Strike Class: MULTI-ATTACK, can only target enemies at Range 2.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'spear' },
  { id: 'melee_halberd', name: 'Halberd', cost: 10, weaponClass: 'Polearm', attack: 'A4/R2', description: 'Can target enemies at Range 1 or 2. First Strike Class: MULTI-ATTACK, can only target enemies at Range 2.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'halberd' },
  { id: 'melee_glaive', name: 'Glaive', cost: 13, weaponClass: 'Polearm', attack: 'A5/R2', description: 'Polearm with a single-edged blade. First Strike Class: MULTI-ATTACK, can only target enemies at Range 2.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'glaive' },
  { id: 'melee_machete', name: 'Machete', cost: 2, weaponClass: 'Sword', attack: 'A2', description: 'Large cleaving knife. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'machete' },
  { id: 'melee_gladius', name: 'Gladius', cost: 6, weaponClass: 'Sword', attack: 'A3', description: 'Roman short sword. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'gladius sword' },
  { id: 'melee_silver_sword', name: 'Silver Sword', cost: 10, weaponClass: 'Sword', attack: 'A3', description: 'Treat as Silver. See Undying Template. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'silver sword' },
  { id: 'melee_long_sword', name: 'Long sword', cost: 10, weaponClass: 'Sword', attack: 'A4', description: 'Standard longsword. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'longsword' },
  { id: 'melee_katana', name: 'Katana', cost: 13, weaponClass: 'Sword', attack: 'A5', description: 'Critical Hit inflict 1 point of BLEED. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'katana' },
  { id: 'melee_silver_wolf_blade', name: 'Silver Wolf Blade', cost: 20, weaponClass: 'Sword', attack: 'A4', description: 'Treat as Silver. If an attack fails to damage an enemy with a Creature of the Night or Monster Template roll again. This can occur once per turn. Deadly Class: Targets hit by a Critical Hit are WOUNDED for 1 turn.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'wolf sword' },
  { id: 'melee_naganata', name: 'Naganata', cost: 16, weaponClass: 'Polearm/Sword', attack: 'A4/R2', description: 'Critical Hit inflict 1 point of BLEED. Benefits from Polearm & Sword classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'naginata' },
  { id: 'melee_ninchaku', name: 'Ninchaku', cost: 8, weaponClass: 'Blunt/Nimble', attack: 'A2', description: 'Benefits from Blunt & Nimble classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'nunchaku' },
  { id: 'melee_electric_chainsaw', name: 'Electric Chainsaw', cost: 6, weaponClass: 'Large', attack: 'A3', description: 'Critical Hits inflict 3 times the damage. Interrupts cannot be used the same turn as a chainsaw. 4 charges per battle. Menacing Class.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'electric chainsaw' },
  { id: 'melee_gas_chainsaw', name: 'Gas Chainsaw', cost: 10, weaponClass: 'Large', attack: 'A4', description: 'Critical Hits inflict 3 times the damage. Interrupts cannot be used the same turn as a chainsaw. 4 charges per battle. Menacing Class.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'gas chainsaw' },
  { id: 'melee_scimitar', name: 'Scimitar', cost: 9, weaponClass: 'Exotic/Nimble', attack: 'A3', description: 'Critical Hits inflict +1 BLEED point. Benefits from Exotic & Nimble classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'scimitar' },
  { id: 'melee_silver_stake', name: 'Silver Stake', cost: 10, weaponClass: 'Exotic/Nimble', attack: 'A2', description: 'Treat as Silver or Stake. See Undying Template. Benefits from Exotic & Nimble classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'silver stake' },
  { id: 'melee_sword_breaker', name: 'Sword Breaker', cost: 8, weaponClass: 'Exotic', attack: 'A3', description: 'Lower targets Melee attack by 1 for each Double Sword rolled. Lasts 1 turns. Sharp Class.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sword breaker' },
  { id: 'melee_whip', name: 'Whip', cost: 3, weaponClass: 'Exotic', attack: 'A3/R3', description: 'Critical Hits do not inflict bonus damage but cause the target to FLINCH. Sharp Class.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'leather whip' },
  { id: 'melee_chain_whip', name: 'Chain Whip', cost: 8, weaponClass: 'Exotic', attack: 'A4/R3', description: 'Critical Hits do not inflict bonus damage but cause the target to FLINCH. Sharp Class.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'chain whip' },
  { id: 'melee_scythe', name: 'Scythe', cost: 13, weaponClass: 'Exotic/Polearm', attack: 'A3/R2', description: 'Benefits from Exotic & Polearm classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'scythe' },
  { id: 'melee_no_dachi', name: 'No Dachi', cost: 18, weaponClass: 'Large/Sword', attack: 'A5', description: 'Benefits from Large & Sword classes.', category: 'Melee Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'nodachi sword' },

  // Ranged Weapons
  { id: 'ranged_shortbow', name: 'Shortbow', cost: 3, weaponClass: 'Bow', attack: 'A2/R4', description: 'Standard shortbow. Bow Class: Piercing (PASSIVE) - Damaged enemies take 1 point of BLEED.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'shortbow' },
  { id: 'ranged_longbow', name: 'Longbow', cost: 7, weaponClass: 'Bow', attack: 'A3/R4', description: 'Standard longbow. Bow Class: Piercing.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'longbow' },
  { id: 'ranged_recurve_bow', name: 'Recurve Bow', cost: 11, weaponClass: 'Bow', attack: 'A4/R6', description: 'Critical Hits inflict +1 BLEED point. Bow Class: Piercing.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'recurve bow' },
  { id: 'ranged_compound_bow', name: 'Compound Bow', cost: 14, weaponClass: 'Bow', attack: 'A5/R4', description: 'Re-roll 1 of the targets Defense Dice. Bow Class: Piercing.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'compound bow' },
  { id: 'ranged_kestrel', name: 'Kestrel', cost: 20, weaponClass: 'Bow/Sniper', attack: 'A5/R5', description: 'Benefits from Bow & Sniper classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'advanced bow' },
  { id: 'ranged_ameli', name: 'Ameli', cost: 9, weaponClass: 'LMG', attack: 'A4/R4', description: 'LMG Class: Full Auto (ACTION) - Treat attack as an AOE. 1 round CD.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'machine gun' },
  { id: 'ranged_pecheneg', name: 'Pecheneg', cost: 12, weaponClass: 'LMG', attack: 'A5/R4', description: 'INTERRUPT – Targeted is MARKED for 1 turn. LMG Class: Full Auto.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'heavy machine gun' },
  { id: 'ranged_aat_52', name: 'AAT-52', cost: 16, weaponClass: 'LMG', attack: 'A6/R4', description: 'French LMG. LMG Class: Full Auto.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'french lmg' },
  { id: 'ranged_22_magnum', name: '22 Magnum', cost: 8, weaponClass: 'Magnum', attack: 'A3/R3', description: 'Magnum Class: Impacting (PASSIVE) - Damaged targets are WOUNDED for 1 turn.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magnum pistol' },
  { id: 'ranged_desert_eagle', name: 'Desert Eagle', cost: 12, weaponClass: 'Magnum', attack: 'A4/R3', description: 'WOUND effect lasts for 2 turns. Magnum Class: Impacting.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'desert eagle' },
  { id: 'ranged_44_cal_magnum', name: '44 Cal Magnum', cost: 15, weaponClass: 'Magnum', attack: 'A5/R3', description: 'Re-roll 1 of the targets Defense Dice. Magnum Class: Impacting.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: '44 magnum' },
  { id: 'ranged_colt_python', name: 'Colt Python', cost: 18, weaponClass: 'Magnum/Revolver', attack: 'A4/R4', description: 'Benefits from Magnum & Revolver classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'colt python' },
  { id: 'ranged_model_460', name: 'Model 460', cost: 20, weaponClass: 'Magnum/Sniper', attack: 'A5/R4', description: 'Critical Hits WOUND target for 2 turns. Benefits from Magnum & Sniper classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'heavy revolver' },
  { id: 'ranged_high_point', name: 'High-Point', cost: 2, weaponClass: 'Pistol', attack: 'A2/R2', description: 'Pistol Class: Close Combat (ACTION) - Range Attack does not trigger an attack of opportunity.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'cheap pistol' },
  { id: 'ranged_9mm_shield', name: '9MM Shield', cost: 7, weaponClass: 'Pistol', attack: 'A3/R3', description: 'Critical Hits do not inflict bonus damage but cause the target to FLINCH. Pistol Class: Close Combat.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: '9mm pistol' },
  { id: 'ranged_g_17', name: 'G-17', cost: 8, weaponClass: 'Pistol', attack: 'A3/R4', description: 'Reliable pistol. Pistol Class: Close Combat.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'glock pistol' },
  { id: 'ranged_beretta', name: 'Beretta', cost: 10, weaponClass: 'Pistol', attack: 'A3/R3', description: 'Make a second attack with this weapon. Pistol Class: Close Combat.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'beretta pistol' },
  { id: 'ranged_1911', name: '1911', cost: 12, weaponClass: 'Pistol', attack: 'A4/R3', description: 'Classic design. Pistol Class: Close Combat.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: '1911 pistol' },
  { id: 'ranged_derringer', name: 'Derringer', cost: 8, weaponClass: 'Pistol/Rapid', attack: 'A2/R3', description: 'Benefits from Pistol & Rapid Fire classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'derringer pistol' },
  { id: 'ranged_rough_rider', name: 'Rough Rider', cost: 10, weaponClass: 'Pistol/Revolver', attack: 'A3/R3', description: '+1 damage to targets with DEF of 2 or less. Benefits from Pistol & Revolver classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'old revolver' },
  { id: 'ranged_the_judge', name: 'The Judge', cost: 16, weaponClass: 'Pistol/Shotgun', attack: 'A3/R3', description: '+1 damage to targets with DEF of 3 or less. Benefits from Pistol & Shotgun classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'judge revolver' },
  { id: 'ranged_machine_pistol', name: 'Machine Pistol', cost: 12, weaponClass: 'Pistol/SMG', attack: 'A3/R4', description: 'Benefits from Pistol & SMG classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'machine pistol' },
  { id: 'ranged_throwing_blade', name: 'Throwing Blade', cost: 3, weaponClass: 'Rapid', attack: 'A2/R2', description: 'Rapid Fire Class: Quick Fire (INTERRUPT) - Attack with the weapon as an Interrupt.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'throwing knife' },
  { id: 'ranged_shuriken', name: 'Shuriken', cost: 7, weaponClass: 'Rapid', attack: 'A3/R2', description: 'Ninja star. Rapid Fire Class: Quick Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'shuriken' },
  { id: 'ranged_boomerang', name: 'Boomerang', cost: 8, weaponClass: 'Rapid', attack: 'A2/R2', description: 'Interrupt CD is not triggered on a MISS. Rapid Fire Class: Quick Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'boomerang' },
  { id: 'ranged_kunai', name: 'Kunai', cost: 11, weaponClass: 'Rapid', attack: 'A3/R3', description: 'Critical Hits inflict 1 point of BLEED. Rapid Fire Class: Quick Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'kunai knife' },
  { id: 'ranged_ninja_star', name: 'Ninja Star', cost: 14, weaponClass: 'Rapid', attack: 'A4/R3', description: 'Critical Hits WOUND target for 1 turn. Rapid Fire Class: Quick Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'large shuriken' },
  { id: 'ranged_snub_nose', name: 'Snub-nose', cost: 3, weaponClass: 'Revolver', attack: 'A2/R3', description: 'Revolver Class: Fan the Hammer (ACTION) - Attack up to 4 times. Cannot Crit. 3 round CD.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'snubnose revolver' },
  { id: 'ranged_colt_mark_iii', name: 'Colt Mark III', cost: 7, weaponClass: 'Revolver', attack: 'A3/R3', description: 'Fan the Hammer can Critically Hit with this gun. Revolver Class.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'colt revolver' },
  { id: 'ranged_ruger_sp101', name: 'Ruger SP101', cost: 11, weaponClass: 'Revolver', attack: 'A3/R4', description: 'Reliable revolver. Revolver Class: Fan the Hammer.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ruger revolver' },
  { id: 'ranged_rhino', name: 'Rhino', cost: 14, weaponClass: 'Revolver', attack: 'A4/R4', description: 'Modern revolver. Revolver Class: Fan the Hammer.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rhino revolver' },
  { id: 'ranged_ar_15', name: 'AR-15', cost: 8, weaponClass: 'Rifle', attack: 'A3/R5', description: 'Rifle Class: Burst Fire (ACTION) - Re-roll 2 missed Attack Dice. 3 round CD.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ar15 rifle' },
  { id: 'ranged_famas', name: 'FAMAS', cost: 12, weaponClass: 'Rifle', attack: 'A4/R6', description: 'Damaged targets are MARKED for 1 turn. Rifle Class: Burst Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'famas rifle' },
  { id: 'ranged_ak_47', name: 'AK-47', cost: 16, weaponClass: 'Rifle', attack: 'A5/R5', description: 'Critical Hits inflict FLINCH for 1 turn. Rifle Class: Burst Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ak47 rifle' },
  { id: 'ranged_savage_6_5_crd', name: 'Savage 6.5 CRD', cost: 16, weaponClass: 'Rifle', attack: 'A4/R7', description: '+1 damage to targets with DEF of 2 or less. Rifle Class: Burst Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'hunting rifle' },
  { id: 'ranged_colt_model_635', name: 'Colt Model 635', cost: 12, weaponClass: 'Rifle/SMG', attack: 'A3/R4', description: 'Benefits from Rifle & SMG classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'colt smg' },
  { id: 'ranged_m_16', name: 'M-16', cost: 20, weaponClass: 'Rifle/SMG', attack: 'A4/R6', description: 'Critical Hits inflict FLINCH for 1 turn. Benefits from Rifle & SMG classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'm16 rifle' },
  { id: 'ranged_ar_10', name: 'AR-10', cost: 13, weaponClass: 'Rifle/Sniper', attack: 'A4/R6', description: 'Critical Hits WOUND target for 1 turn. Benefits from Rifle & Sniper classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ar10 rifle' },
  { id: 'ranged_stoner_sr_25', name: 'Stoner SR-25', cost: 16, weaponClass: 'Rifle/Sniper', attack: 'A4/R7', description: 'Benefits from Rifle & Sniper classes.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sr25 rifle' },
  { id: 'ranged_sawed_off', name: 'Sawed Off', cost: 8, weaponClass: 'Shotgun', attack: 'A3/R3', description: 'Shotgun Class: Spread (PASSIVE) - Attack one additional enemy adjacent to the target.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sawed off shotgun' },
  { id: 'ranged_under_barrel', name: 'Under barrel', cost: 9, weaponClass: 'Shotgun', attack: 'A3/R3', description: 'Adds Shotgun Class to a Rifle. This item does not take up a Gear slot. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'underbarrel shotgun' },
  { id: 'ranged_slug_arrow', name: 'Slug Arrow', cost: 9, weaponClass: 'Shotgun', attack: 'A3/R3', description: 'Adds Shotgun Class to a Bow This item does not take up a Gear slot. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'shotgun arrow' },
  { id: 'ranged_security_model', name: 'Security Model', cost: 12, weaponClass: 'Shotgun', attack: 'A4/R3', description: 'Security shotgun. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'security shotgun' },
  { id: 'ranged_browning_bps', name: 'Browning BPS', cost: 12, weaponClass: 'Shotgun', attack: 'A3/R5', description: 'Critical Hits inflict 1 point of BLEED. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'browning shotgun' },
  { id: 'ranged_pump_action', name: 'Pump Action', cost: 16, weaponClass: 'Shotgun', attack: 'A5/R3', description: 'Standard pump shotgun. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'pump action shotgun' },
  { id: 'ranged_benelli', name: 'Benelli', cost: 18, weaponClass: 'Shotgun', attack: 'A6/R4', description: 'Re-roll 1 of the targets Defense Dice. Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'benelli shotgun' },
  { id: 'ranged_mossberg_500', name: 'Mossberg 500', cost: 6, weaponClass: 'Shotgun', attack: 'SPECIAL', description: 'Take 1 turn to load cartridge then pick 1 of the 3 damage range values; I:A4/R2; II:A3/R4; III:A1/R5; Shotgun Class: Spread.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'mossberg shotgun' },
  { id: 'ranged_mac_10', name: 'Mac 10', cost: 8, weaponClass: 'SMG', attack: 'A3/R3', description: 'SMG Class: Suppressive Fire (INTERRUPT) - Roll attack. BASE Template enemies have Range Value lowered by 1 per HIT. No damage. 3 round CD.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'mac 10 smg' },
  { id: 'ranged_uzi', name: 'Uzi', cost: 10, weaponClass: 'SMG', attack: 'A3/R4', description: 'Critical Hits inflict FLINCH for 1 turn. SMG Class: Suppressive Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'uzi smg' },
  { id: 'ranged_mp5', name: 'MP5', cost: 12, weaponClass: 'SMG', attack: 'A4/R5', description: 'Damaged targets FLINCH for 1 turn. SMG Class: Suppressive Fire.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'mp5 smg' },
  { id: 'ranged_scout_rifle', name: 'Scout Rifle', cost: 6, weaponClass: 'Sniper', attack: 'A2/R7', description: 'Sniper Class: Called Shot (Action) - Spend 1 round to aim. DOUBLE SWORDS rolled bypass defense.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'scout rifle' },
  { id: 'ranged_model_70_sharpshooter', name: 'Model 70 Sharpshooter', cost: 10, weaponClass: 'Sniper', attack: 'A3/R8', description: 'Critical Hits inflict 1 point of BLEED. Sniper Class: Called Shot.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sniper rifle' },
  { id: 'ranged_predator', name: 'Predator', cost: 13, weaponClass: 'Sniper', attack: 'A4/R7', description: 'INTERRUPT – Targeted is MARKED for 1 turn. Sniper Class: Called Shot.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'predator rifle' },
  { id: 'ranged_sv_98', name: 'SV-98', cost: 16, weaponClass: 'Sniper', attack: 'A5/R8', description: 'Critical Hits WOUND target for 1 turn. Sniper Class: Called Shot.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'sv98 sniper' },
  { id: 'ranged_barrett_50_cal', name: 'Barrett 50 Cal', cost: 20, weaponClass: 'Sniper', attack: 'A6/R8', description: 'Re-roll 1 of the targets Defense Dice. Sniper Class: Called Shot.', category: 'Ranged Weapon', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'barrett 50 cal' },
  
  // Augments
  { id: 'aug_swiss_army_knife', name: 'Swiss Army Knife', cost: 6, description: '+2 when attempting an Engineering skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'swiss army knife' },
  { id: 'aug_ninja_mask', name: 'Ninja mask', cost: 6, description: '+2 when attempting a Deception skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ninja mask' },
  { id: 'aug_first_aid_kit_skill', name: 'First Aid Kit', cost: 6, description: '+2 when attempting an Empathy skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'first aid skill' }, // Renamed ID slightly to avoid conflict
  { id: 'aug_fitness_tracker', name: 'Fitness Tracker', cost: 6, description: '+2 when attempting an Athletics skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fitness tracker' },
  { id: 'aug_art_of_war', name: 'The Art of War', cost: 6, description: '+2 when attempting a Tactician skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'art of war book' },
  { id: 'aug_self_help_book', name: 'Self Help book', cost: 6, description: '+2 when attempting a Personality skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'self help book' },
  { id: 'aug_bug_out_bag', name: 'Bug out bag', cost: 6, description: '+2 when attempting a Survival skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'bug out bag' },
  { id: 'aug_wiki', name: 'Wiki', cost: 6, description: '+2 when attempting a Knowledge skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'encyclopedia' },
  { id: 'aug_not_wiki', name: 'Not Wiki', cost: 6, description: '+2 when attempting a Computer Use skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'hacker laptop' },
  { id: 'aug_book_of_shadows', name: 'Book of Shadows', cost: 6, description: '+2 when attempting an Occult skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'spellbook occult' },
  { id: 'aug_magnifying_glass', name: 'Magnifying Glass', cost: 6, description: '+2 when attempting an Investigation skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magnifying glass' },
  { id: 'aug_driving_gloves', name: 'Driving Gloves', cost: 6, description: '+2 when attempting a Dare Devil skill check.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'driving gloves' },
  { id: 'aug_rule_book', name: 'Rule Book', cost: 15, description: 'Upgrade a Hunter\'s non-trained skill to skill level 2. This item is consumed upon use but can be purchased again for a different Hunter. If used on the same Hunter multiple times it overwrites the original use. Cannot be used on Tuner or for a Skill a that the Hunter already has at least 1 point value in.', category: 'Augment', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rulebook game' },

  // Utility - Ammunition
  { id: 'util_ammo_incendiary', name: 'Incendiary Ammo', actionType: 'Free Action', cost: 2, charges: 3, description: 'Element of Range Attack is now FIRE for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fire bullets' },
  { id: 'util_ammo_taze_tipped', name: 'Taze Tipped', actionType: 'Free Action', cost: 3, charges: 3, description: 'Element of Range Attack is now ELEC for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'electric bullets' },
  { id: 'util_ammo_frozen_tipped', name: 'Frozen Tipped', actionType: 'Free Action', cost: 4, charges: 3, description: 'Element of Range Attack is now ICE for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ice bullets' },
  { id: 'util_ammo_armor_piercing', name: 'Armor Piercing', actionType: 'Free Action', cost: 4, charges: 3, description: 'Target rolls -1 Defense when attacked by Ranged attack of user.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'armor piercing' },
  { id: 'util_ammo_silver_laced', name: 'Silver Laced', actionType: 'Free Action', cost: 3, charges: 3, description: 'Element of Range attack is now ETHER for 1 turn.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'silver bullets' },
  { id: 'util_ammo_p_plus_rounds', name: 'P+ Rounds', actionType: 'Free Action', cost: 6, charges: 3, description: 'Increase Attack Value by 2 with a Range weapon.', category: 'Utility', subCategory: 'Ammunition', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'high power bullets' },
  
  // Utility - Bombs
  { id: 'util_bomb_pipe', name: 'Pipe bomb', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A2/R4 - AOE', description: 'PHYSICAL bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'pipe bomb' },
  { id: 'util_bomb_liquid_nitrogen', name: 'Liquid Nitrogen', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A2/R4 - AOE - ICE', description: 'ICE bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'nitrogen bomb' },
  { id: 'util_bomb_napalm', name: 'Napalm', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A2/R4 - AOE - FIRE', description: 'FIRE bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'napalm bomb' },
  { id: 'util_bomb_holy_water', name: 'Holy Water', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A3/R4 - AOE - ETHER', description: 'ETHER bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'holy water' },
  { id: 'util_bomb_frag', name: 'Frag Bomb', actionType: 'Action', cost: 6, charges: 1, attack: 'A4/R4 - AOE - PHYSICAL', description: 'Powerful PHYSICAL bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'frag grenade' },
  { id: 'util_bomb_cryo', name: 'Cryo Bomb', actionType: 'Action', cost: 6, charges: 1, attack: 'A3/R4 - AOE - ICE', description: 'Powerful ICE bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'cryo grenade' },
  { id: 'util_bomb_thermite', name: 'Thermite Bomb', actionType: 'Action', cost: 6, charges: 1, attack: 'A3/R4 - AOE - FIRE', description: 'Powerful FIRE bomb.', category: 'Utility', subCategory: 'Bombs', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'thermite grenade' },

  // Utility - Traps
  { id: 'util_trap_net', name: 'Net Trap', actionType: 'Action', cost: 3, charges: 2, description: 'Target is afflicted by Immobilize of 10. TRIGGER - Enemy unit moves on Trap Icon.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'net trap' },
  { id: 'util_trap_land_mine', name: 'Land Mine', actionType: 'Action', cost: 5, charges: 1, attack: 'A5 - PHYSICAL', description: 'TRIGGER - Enemy unit moves on Trap Icon.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'landmine' },
  { id: 'util_trap_caltrops', name: 'Caltrops', actionType: 'Interrupt', cost: 3, charges: 2, attack: 'A3 - PHYSICAL', description: 'Damaged targets take 1 point of Bleed. TRIGGER - Enemy unit moves on Map tile with Trap Icon. Lasts 2 turns once triggered.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'caltrops' },
  { id: 'util_trap_bear', name: 'Bear Trap', actionType: 'Action', cost: 3, charges: 1, attack: 'A6 - PHYSICAL', description: 'Only attacks first enemy to trigger. Damaged targets take 2 points of Bleed. TRIGGER - Enemy unit moves on Trap Icon.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'bear trap' },
  { id: 'util_trap_immolation', name: 'Immolation Trap', actionType: 'Action', cost: 3, charges: 1, attack: 'A4 - FIRE', description: 'TRIGGER - Enemy unit moves on Trap Icon.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fire trap' },
  { id: 'util_trap_ghost', name: 'Ghost Trap', actionType: 'Action', cost: 6, charges: 2, description: 'Paralyze any units of the UNDEAD Template for 1 turn. TRIGGER - Detonator.', category: 'Utility', subCategory: 'Traps', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'ghost trap' },

  // Utility - Healing
  { id: 'util_heal_espresso', name: 'Espresso Shot', actionType: 'Interrupt', cost: 3, charges: 2, description: 'Restore 1 HP, +1 Movement for 2 turns.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'espresso shot' },
  { id: 'util_heal_band_aid', name: 'Band-Aid', actionType: 'Action', cost: 2, charges: 3, description: 'Restore 1 HP', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'band aid' },
  { id: 'util_heal_stim_pack', name: 'Stim Pack', actionType: 'Interrupt', cost: 6, charges: 2, attack: 'A2/R1', description: 'Restore 1 HP to target for each Hit Rolled', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'stimpack syringe' },
  { id: 'util_heal_gauze', name: 'Gauze', actionType: 'Action', cost: 6, charges: 3, attack: 'A3/R1', description: 'Restore 1 HP to target for each Hit Rolled', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'gauze roll' },
  { id: 'util_heal_first_aid_kit', name: 'First Aid Kit', actionType: 'Action', cost: 8, charges: 4, description: 'Restore 2 HP to target', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'first aid kit' }, // ID updated
  { id: 'util_heal_tourniquet', name: 'Tourniquet', actionType: 'Action', cost: 4, charges: 3, description: 'Restore 1 Bleed Point to the target', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'tourniquet' },
  { id: 'util_heal_t_acid', name: 'T-Acid', actionType: 'Interrupt', cost: 6, charges: 2, description: 'Restore 3 Bleed Points to the target', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'acid vial' },
  { id: 'util_heal_eye_drops', name: 'Eye Drops', actionType: 'Interrupt', cost: 2, charges: 2, description: 'Remove Blind from target.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'eye drops' },
  { id: 'util_heal_antidote', name: 'Antidote', actionType: 'Interrupt', cost: 2, charges: 2, description: 'Remove Poison effect from target.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'antidote vial' },
  { id: 'util_heal_anti_venom', name: 'Anti-Venom', actionType: 'Action', cost: 2, charges: 2, description: 'Target is immune to Poison for 3 turns.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'anti venom' },
  { id: 'util_heal_anti_cogulant', name: 'Anti-Cogulant', actionType: 'Action', cost: 2, charges: 2, description: 'Target is immune to Bleed for 2 turns.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'blood vial' },
  { id: 'util_heal_speed', name: 'Speed', actionType: 'Interrupt', cost: 2, charges: 3, description: 'Target can make an extra movement action. Take 1 Sanity damage.', category: 'Utility', subCategory: 'Healing', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'pills speed' },

  // Utility - Battery Items
  { id: 'util_battery_flashlight', name: 'Flash Light', actionType: 'Interrupt', cost: 0, charges: 'Battery', description: 'Treat the map tile this character is on as a Light Score of 1. This character cannot use any Interrupts while the Flash Light is on.', category: 'Utility', subCategory: 'Battery', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'flashlight' },
  { id: 'util_battery_headlight', name: 'Headlight', actionType: 'Passive', cost: 2, charges: 'Battery', description: 'Treat the map tile this character is on as a Light Score of 1.', category: 'Utility', subCategory: 'Battery', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'headlamp' },
  { id: 'util_battery_night_vision', name: 'Night Vision Goggles', actionType: 'Free Action', cost: 2, charges: 'Battery', description: 'Ignore the Stealth effect of enemies', category: 'Utility', subCategory: 'Battery', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'night vision goggles' },
  { id: 'util_battery_flashlight_plus', name: 'Flash Light +', actionType: 'Interrupt', cost: 1, charges: 'Battery x2', description: 'Treat the map tile this character is on as a Light Score of 1. This character cannot use any interrupts while the Flash Light is on.', category: 'Utility', subCategory: 'Battery', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'powerful flashlight' },

  // Utility - Miscellaneous Items
  { id: 'util_misc_glow_stick', name: 'Glow Stick', actionType: 'Action', cost: 1, charges: 2, description: 'Treat as Light Source for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'glow stick' },
  { id: 'util_misc_lantern', name: 'Lantern', actionType: 'Action', cost: 1, charges: 1, description: 'Place 1 Light Source on any map tile.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'old lantern' },
  { id: 'util_misc_surgeon_mask', name: 'Surgeon Mask', actionType: 'Action', cost: 2, charges: 1, description: 'Target is treated as Healer when determining enemy logic. Lasts 2 turns. Does not prevent COVID.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'surgical mask' },
  { id: 'util_misc_dummies_guide', name: "Dummies Guide", actionType: 'Action', cost: 2, charges: 2, description: 'Target gains +1 to one Skill check in combat. Does not stack with other Guides.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'guide book' },
  { id: 'util_misc_roller_blades', name: 'Roller Blades', actionType: 'Interrupt', cost: 2, charges: 3, description: 'Targets movement increases by 2 for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'roller skates' },
  { id: 'util_misc_anti_static_band', name: 'Anti-static Wrist Band', actionType: 'Interrupt', cost: 2, charges: 2, description: 'Target is immune to ELEC status effect for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'wristband' },
  { id: 'util_misc_bucket_water', name: 'Bucket of Water', actionType: 'Interrupt', cost: 2, charges: 2, description: 'Target is immune to FIRE status effect for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'water bucket' },
  { id: 'util_misc_hot_coffee', name: 'Hot Coffee', actionType: 'Interrupt', cost: 2, charges: 2, description: 'Target is immune to COLD status effect for 3 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'coffee mug' },
  { id: 'util_misc_laser_pointer', name: 'Laser Pointer', actionType: 'Action', cost: 3, charges: 4, attack: 'R8', description: 'Ranged attacks against Target treat their Max range as 2 higher. Lasts 2 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'laser pointer' },
  { id: 'util_misc_rope', name: 'Rope', actionType: 'Interrupt', cost: 3, charges: 1, attack: 'R3', description: 'Tricks of The Trade "All right, get your stupid ****ing rope."', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rope coil' },
  { id: 'util_misc_bola', name: 'Bola', actionType: 'Interrupt', cost: 3, charges: 1, attack: 'R6', description: 'Immobilize of 6', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'bola weapon' },
  { id: 'util_misc_dummies_guide_plus', name: "Dummies Guide +", actionType: 'Action', cost: 6, charges: 1, description: 'Target gains +2 to one Skill check in combat. Does not stack with other Guides.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'advanced guide book' },
  { id: 'util_misc_targeting_sight', name: 'Targeting Sight', actionType: 'Action', cost: 6, charges: 2, description: 'Inflict MARKED Status on Target. Lasts 2 turns.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'targeting scope' },
  { id: 'util_misc_pepper_spray', name: 'Pepper Spray', actionType: 'Interrupt', cost: 6, charges: 1, attack: 'R4', description: 'Blind target for 1 turn.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'pepper spray' },
  { id: 'util_misc_wicked_pencil', name: 'Wicked Pencil', actionType: 'Action', cost: 20, charges: 1, attack: 'A*/R1', description: 'Roll Combat dice and continue rolling for each HIT rolled. Stop on a Miss to determine Attack Value. Double Swords bypass Defense.', category: 'Utility', subCategory: 'Miscellaneous', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'cursed pencil' },

  // Consumables
  { id: 'consum_blessed_glow_sticks', name: 'Blessed Glow Sticks', actionType: 'Interrupt', cost: 2, charges: 1, stock: 1, description: 'R6 -Place 1 Light Source on any map tile. These Light Sources cannot be destroyed.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'blessed glow sticks' },
  { id: 'consum_flood_light', name: 'Flood Light', actionType: 'Action', cost: 3, charges: 1, stock: 1, attack: 'R1', description: 'Place 3 Light Sources on the map. Each Light Source must be on a map tile adjacent to the other.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'portable floodlight' },
  { id: 'consum_frag_grenade_pro', name: 'Frag Grenade - Pro', actionType: 'Action', cost: 2, charges: 1, stock: 1, attack: 'A6/R4 – PHYSICAL- AOE 2 spaces from target', description: 'Professional grade fragmentation grenade.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'frag grenade' },
  { id: 'consum_cryo_grenade_pro', name: 'Cryo Grenade - Pro', actionType: 'Action', cost: 2, charges: 1, stock: 1, attack: 'A5/R4 – ICE - AOE 2 spaces from target', description: 'Professional grade cryo grenade.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'cryo grenade' },
  { id: 'consum_thermite_grenade_pro', name: 'Thermite Grenade - Pro', actionType: 'Action', cost: 2, charges: 1, stock: 1, attack: 'A5/R4 - FIRE - AOE 2 spaces from target', description: 'Professional grade thermite grenade.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'thermite grenade' },
  { id: 'consum_emergency_kit', name: 'Emergency Kit', actionType: 'Interrupt', cost: 1, charges: 2, stock: 2, attack: 'A3/R1', description: 'Restore 1 HP to target for each Hit Rolled', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'emergency kit' },
  { id: 'consum_trauma_kit', name: 'Trauma Kit', actionType: 'Action', cost: 2, charges: 2, stock: 2, attack: 'A5/R1', description: 'Restore 1 HP to target for each Hit Rolled', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'trauma kit' },
  { id: 'consum_flash_bang', name: 'Flash Bang', actionType: 'Interrupt', cost: 1, charges: 1, stock: 1, attack: 'R6', description: 'any enemies within range are Blinded for 2 turns. AOE 2 spaces from target.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'flashbang grenade' },
  { id: 'consum_c4', name: 'C4', actionType: 'Action', cost: 5, charges: 1, stock: 1, attack: 'A6- FIRE', description: 'TRAP- TRIGGER – Detonator. AOE extends 4 spaces from Tile.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'c4 explosive' },
  { id: 'consum_energy_drink', name: 'Energy Drink', actionType: 'Free Action', cost: 1, charges: 1, stock: 1, attack: 'R1', description: 'Hunter can take another turn.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'energy drink can' },
  { id: 'consum_stimulant', name: 'Stimulant', actionType: 'Interrupt', cost: 2, charges: 1, stock: 1, attack: 'R1', description: 'Hunter is immune to negative Status effects this turn.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'stimulant pills' },
  { id: 'consum_signal_of_virtue', name: 'Signal of Virtue', actionType: 'Action', cost: 5, charges: 1, stock: 1, attack: 'R1', description: 'Nothing happens but you feel better about the current thing.', category: 'Consumable', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'virtue signal' },

  // Relics
  { id: 'relic_constantines_lighter', name: 'Constantine\'s Lighter', cost: 6, skillCheck: 'I-5; II-8', actionType: 'Action', description: 'I - Treat the tile this unit is on as a Light Score of 1. Lasts 4 turns. II - Draw on the energy of another Light Source on the Map and move it to the tile of your choice.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magic lighter' },
  { id: 'relic_exorcists_cross', name: "Exorcist's Cross", cost: 6, skillCheck: '5', actionType: 'Action', description: 'Instantly destroy 1 Poltergeist or Phantasm.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'exorcist cross' },
  { id: 'relic_bugs_in_a_box', name: 'Bugs in a box', cost: 6, skillCheck: '6', actionType: 'Interrupt', description: 'When the box is rattled up to 2 summoned monsters within 3 spaces of the caster are PARALYZED for 1 turn.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'box bugs' },
  { id: 'relic_broken_phylactery', name: 'Broken Phylactery', cost: 8, skillCheck: '8', actionType: 'Passive', description: 'Wielder regains 1 Interrupt whenever anyone dies in battle.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'broken amulet' },
  { id: 'relic_pyromaniacs_lantern', name: "Pyromaniac's Lantern", cost: 10, skillCheck: 'I-5; II-8', actionType: 'Action', attack: 'A3/R6 single target FIRE attack', description: 'I - Action; II - Interrupt', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'fire lantern' },
  { id: 'relic_crones_finger', name: "Crone's Finger", cost: 10, skillCheck: 'I-5; II-8', actionType: 'Action', attack: 'A4/R4 single target ICE attack', description: 'I - Action; II – FROZEN on HIT', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'severed finger' },
  { id: 'relic_broken_stopwatch', name: 'Broken Stopwatch', cost: 10, skillCheck: '6', actionType: 'Interrupt', description: 'Any status effects on target now last an additional turn. This can only be used once for each application of a status effect.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'broken stopwatch' },
  { id: 'relic_rain_stick', name: 'Rain Stick', cost: 15, skillCheck: '8', actionType: 'Action', description: 'Alter the weather in the area to increase likelihood of status effects occurring. Pick between FIRE/ICE/ELEC, elemental status effects tied to this element now occur on a HIT. Lasts 3 turns.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'rain stick' },
  { id: 'relic_music_box', name: 'Music Box', cost: 10, skillCheck: '6', actionType: 'Action', description: 'Sacrifice 2 Sanity to restore all Interrupts to 1 Hunter.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'old music box' },
  { id: 'relic_black_glove', name: 'Black Glove', cost: 10, skillCheck: '3', actionType: 'Action', attack: 'A4/R6 – NETHER', description: 'User takes 1 Sanity damage per use.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'black glove' },
  { id: 'relic_gothic_bell', name: 'Gothic Bell', cost: 10, skillCheck: '8', actionType: 'Action', attack: 'R3', description: 'Control enemy unit for 1 turn. User takes 1 Sanity damage. 2 round CD.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'gothic bell' },
  { id: 'relic_lapis_lazuli', name: 'Lapis Lazuli', cost: 10, skillCheck: '0', actionType: 'Passive', description: 'Lapis Lazuli was believed to guide spirits to a peaceful afterlife. +1 Damage against Undead and Vampires.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'lapis lazuli gem' },
  { id: 'relic_philosophers_dust', name: "Philosopher's Dust", cost: 15, skillCheck: '6', actionType: 'Interrupt', attack: 'R6', description: 'Change Element of ability for 1 turn. 2 round CD.', category: 'Relic', imageUrl: 'https://placehold.co/150x150.png', dataAiHint: 'magic dust' },
];

const categoryIcons: Record<ShopItem['category'], React.ElementType> = {
  'Defense': ShieldAlert,
  'Melee Weapon': Swords,
  'Ranged Weapon': Crosshair,
  'Augment': WandSparkles,
  'Utility': Construction,
  'Consumable': Droplets,
  'Relic': HelpCircle,
};

const subCategoryIcons: Record<NonNullable<ShopItem['subCategory']>, React.ElementType> = {
  'Ammunition': Crosshair,
  'Bombs': Bomb,
  'Traps': Zap,
  'Healing': Ambulance,
  'Battery': BatteryCharging,
  'Miscellaneous': Puzzle,
};

const orderedCategories: ShopItem['category'][] = [
  'Defense',
  'Melee Weapon',
  'Ranged Weapon',
  'Augment',
  'Utility',
  'Consumable',
  'Relic',
];

export function ShopUI() {
  const { toast } = useToast();
  const [playerCrypto, setPlayerCrypto] = useState(2000); 
  const [inventory, setInventory] = useState<ShopItem[]>(shopInventory.map(item => ({
    ...item,
    stock: item.category === 'Consumable' && item.stock === undefined ? (typeof item.charges === 'number' ? item.charges : 1) : item.stock,
  })));

  const handleBuyItem = (itemToBuy: ShopItem) => {
    if (playerCrypto < itemToBuy.cost) {
      toast({
        title: "Insufficient Crypto",
        description: `You need ${itemToBuy.cost} Crypto for ${itemToBuy.name}, but you only have ${playerCrypto}.`,
        variant: "destructive",
      });
      return;
    }

    if (itemToBuy.stock !== undefined && itemToBuy.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${itemToBuy.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    setPlayerCrypto(prevCrypto => prevCrypto - itemToBuy.cost);
    
    if (itemToBuy.stock !== undefined) {
      setInventory(prevInv => 
        prevInv.map(item => 
          item.id === itemToBuy.id ? { ...item, stock: Math.max(0, item.stock! - 1) } : item
        )
      );
    }

    toast({
      title: "Purchase Successful!",
      description: `You bought ${itemToBuy.name} for ${itemToBuy.cost} Crypto.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center mb-2">
            <Store className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-4xl font-bold">Whispers &amp; Wares</CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            Uncommon goods for the discerning hunter. Spend your hard-earned Crypto.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-end items-center mb-6 p-3 bg-card rounded-lg shadow">
            <Coins className="h-6 w-6 text-yellow-400 mr-2" />
            <span className="text-xl font-semibold">Your Crypto: {playerCrypto}</span>
          </div>

          <ScrollArea className="h-[calc(100vh-22rem)] md:h-[calc(100vh-27rem)] pr-3">
            {inventory.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">The shop is currently empty. Check back later!</p>
            ) : (
              orderedCategories.map(category => {
                const itemsForThisCategory = inventory.filter(item => item.category === category);
                const CategoryIcon = categoryIcons[category] || HelpCircle;
                
                if (itemsForThisCategory.length === 0 && category !== 'Utility') return null; // Skip empty non-utility categories for cleaner UI

                return (
                  <div key={category} className="mb-8">
                    <div className="flex items-center mb-4 pb-2 border-b border-primary/30">
                      <CategoryIcon className="h-7 w-7 text-primary mr-3" />
                      <h2 className="text-2xl font-semibold text-primary">{category}</h2>
                    </div>
                    
                    {category === 'Utility' ? (
                      Object.values(subCategoryIcons).map(SubIcon => {
                        const subCategoryName = (Object.keys(subCategoryIcons) as Array<keyof typeof subCategoryIcons>).find(key => subCategoryIcons[key] === SubIcon);
                        if (!subCategoryName) return null;
                        
                        const itemsForThisSubCategory = itemsForThisCategory.filter(item => item.subCategory === subCategoryName);
                        if (itemsForThisSubCategory.length === 0) return null;

                        return (
                          <div key={subCategoryName} className="mb-6 pl-4">
                             <div className="flex items-center mb-3 text-xl font-medium text-muted-foreground">
                              <SubIcon className="h-5 w-5 mr-2" />
                              <h3>{subCategoryName}</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                              {itemsForThisSubCategory.map((item) => {
                                const IconForSubCategory = item.subCategory ? subCategoryIcons[item.subCategory] : null;
                                return (
                                  <Card key={item.id} className="flex flex-col bg-card/80 hover:shadow-primary/30 transition-shadow">
                                    <CardHeader className="p-3">
                                      {item.imageUrl && (
                                        <div className="relative w-full h-32 md:h-36 mb-2 rounded overflow-hidden border border-border bg-muted/30">
                                          <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                          />
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-md leading-tight">{item.name}</CardTitle>
                                        {/* No main category icon here, subcategory handled below */}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {/* SubCategory already shown in section title */}
                                      </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow p-3 pt-0 space-y-1 text-xs">
                                      <p className="text-muted-foreground text-pretty">{item.description}</p>
                                      {item.weaponClass && <p><span className="font-semibold">Class:</span> {item.weaponClass}</p>}
                                      {item.attack && <p><span className="font-semibold">Attack:</span> {item.attack}</p>}
                                      {item.actionType && <p><span className="font-semibold">Type:</span> {item.actionType}</p>}
                                      {typeof item.charges === 'number' && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                                      {typeof item.charges === 'string' && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                                      {item.skillCheck && <p><span className="font-semibold">Skill Check:</span> {item.skillCheck}</p>}
                                    </CardContent>
                                    <CardFooter className="p-3 flex flex-col items-start space-y-2 border-t mt-auto">
                                      <div className="w-full flex justify-between items-center">
                                        <p className="text-lg font-semibold text-primary">{item.cost} Crypto</p>
                                        {item.stock !== undefined && (
                                          <Badge variant={item.stock > 0 ? "default" : "destructive"} className="bg-primary/10 text-primary-foreground border-primary text-xs">
                                            {item.stock > 0 ? `Stock: ${item.stock}` : "Out of Stock"}
                                          </Badge>
                                        )}
                                      </div>
                                      <Button
                                        onClick={() => handleBuyItem(item)}
                                        className="w-full bg-primary hover:bg-primary/80"
                                        disabled={(item.stock !== undefined && item.stock <= 0) || playerCrypto < item.cost}
                                      >
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Buy Item
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : itemsForThisCategory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {itemsForThisCategory.map((item) => (
                           <Card key={item.id} className="flex flex-col bg-card/80 hover:shadow-primary/30 transition-shadow">
                            <CardHeader className="p-3">
                              {item.imageUrl && (
                                <div className="relative w-full h-32 md:h-36 mb-2 rounded overflow-hidden border border-border bg-muted/30">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-md leading-tight">{item.name}</CardTitle>
                                {/* Main category icon is in the section header */}
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow p-3 pt-0 space-y-1 text-xs">
                              <p className="text-muted-foreground text-pretty">{item.description}</p>
                              {item.weaponClass && <p><span className="font-semibold">Class:</span> {item.weaponClass}</p>}
                              {item.attack && <p><span className="font-semibold">Attack:</span> {item.attack}</p>}
                              {item.actionType && <p><span className="font-semibold">Type:</span> {item.actionType}</p>}
                              {typeof item.charges === 'number' && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                              {typeof item.charges === 'string' && <p><span className="font-semibold">Charges:</span> {item.charges}</p>}
                              {item.skillCheck && <p><span className="font-semibold">Skill Check:</span> {item.skillCheck}</p>}
                            </CardContent>
                            <CardFooter className="p-3 flex flex-col items-start space-y-2 border-t mt-auto">
                               <div className="w-full flex justify-between items-center">
                                <p className="text-lg font-semibold text-primary">{item.cost} Crypto</p>
                                {item.stock !== undefined && (
                                    <Badge variant={item.stock > 0 ? "default" : "destructive"} className="bg-primary/10 text-primary-foreground border-primary text-xs">
                                    {item.stock > 0 ? `Stock: ${item.stock}` : "Out of Stock"}
                                    </Badge>
                                )}
                               </div>
                              <Button
                                onClick={() => handleBuyItem(item)}
                                className="w-full bg-primary hover:bg-primary/80"
                                disabled={(item.stock !== undefined && item.stock <= 0) || playerCrypto < item.cost}
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" /> Buy Item
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No items in this category currently.</p>
                    )}
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

    