
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Shuffle, RotateCcw, Hand } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface GameCard {
  id: string;
  name: string;
  type: string; // e.g., 'Event', 'Item', 'Madness'
  deck: string;
  description: string;
  imageUrl?: string;
  dataAiHint: string;
  isHoldable?: boolean;
}

const clashCardImageUrls = [
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%201.png?alt=media&token=9572fefe-ca20-487a-9278-23705019273f",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2010%20copy.png?alt=media&token=205a8ce1-c0f8-455c-af6f-c571c60f587d",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2011%20copy.png?alt=media&token=82b15447-7ec9-471d-966b-6e435008284c",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2012.png?alt=media&token=ec31c317-9f8d-42f0-a736-2a8f0915ecdd",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2013%20copy.png?alt=media&token=286b117c-af9a-4c28-88e9-4d3c141b8410",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2014.png?alt=media&token=ccaf7f26-b8ff-4fa1-a82e-a5cdc78de01f",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2015%20copy.png?alt=media&token=997a5a95-2063-4261-b483-92515f0549fa",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2016%20copy.png?alt=media&token=d941b5b4-bebc-48d9-84aa-3ea8b19e1083",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2017%20copy.png?alt=media&token=d5d33e6e-199e-4d19-82c2-41d065456f7c",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2018%20copy.png?alt=media&token=f1aacf2d-880b-4af8-8cd8-542d237c31cc",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2019%20copy.png?alt=media&token=63793e0a-6e4f-4c1a-8a3d-35979b65e092",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%202.png?alt=media&token=6ec4b3cb-1146-4e57-bca5-5209a25d7ed9",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2020%20copy.png?alt=media&token=6b7b0268-f7eb-43b8-b78a-555057bed1ed",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2021.png?alt=media&token=78fc2ca4-7b01-4334-bc29-f7064caede84",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2022%20copy.png?alt=media&token=ffa8d295-ea0f-4550-bda8-84855b2790ee",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2023%20copy.png?alt=media&token=e617a98e-1dc4-42a4-b2ce-9d6fee374bc6",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2024.png?alt=media&token=f03a8968-62d6-43e9-871e-f3a06f66ac49",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2025.png?alt=media&token=49cd2fee-1e4d-413c-aac7-7530fdcdd2c8",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2026%20copy.png?alt=media&token=b7ee5a11-b83c-44b6-8bab-18a5bc68f245",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2027%20copy.png?alt=media&token=7a534e30-f3c3-463a-baff-982c7a569c6d",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2028%20copy.png?alt=media&token=b17f88fe-1297-49b8-a30b-a7a662219ee1",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2029.png?alt=media&token=602435d1-ea14-4837-b9ee-732c33a17484",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%203%20copy.png?alt=media&token=a39ef525-6c60-4208-a869-109669e42278",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%2030.png?alt=media&token=4377ab1b-7aa8-476c-9316-b2aa672c1619",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%204.png?alt=media&token=515d8ff8-a724-473c-aa43-2c7c9ee023e8",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%205.png?alt=media&token=8f7e9b9c-fc85-4015-9cfb-da9a8cd906c9",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%206%20copy.png?alt=media&token=4dd50f1c-3c80-4e71-94de-65e782fa7c26",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%207%20copy.png?alt=media&token=e33f698e-a8d6-4f05-986a-cb28834770e6",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%208%20copy.png?alt=media&token=854d2418-0717-47b0-bd25-a05c553e4d5f",
  "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Cards%2FClash%2FDN%209%20copy.png?alt=media&token=2fcb052e-c0a6-403a-a4b3-d8b8c202962e",
];

const generateClashCards = (): GameCard[] => {
  const holdableClashCardIds = new Set([
    'cl3', 'cl4', 'cl7', 'cl8', 'cl13', 'cl16', 'cl17', 'cl19', 
    'cl20', 'cl21', 'cl22', 'cl23', 'cl24', 'cl25', 'cl26', 'cl27'
  ]);

  const existingCards: GameCard[] = [
    { id: "cl1", name: "Sudden Strike", type: "Clash", deck: "Clash Deck", description: "The Beast lashes out unexpectedly. The targeted hero must defend or suffer 2 damage.", imageUrl: clashCardImageUrls[0], dataAiHint: "beast attack", isHoldable: holdableClashCardIds.has("cl1") },
    { id: "cl2", name: "Feint", type: "Clash", deck: "Clash Deck", description: "The Beast attempts to trick a hero. If successful, the hero loses their next action.", imageUrl: clashCardImageUrls[1], dataAiHint: "cunning beast", isHoldable: holdableClashCardIds.has("cl2") },
    { id: "cl3", name: "Desperate Claw", type: "Clash", deck: "Clash Deck", description: "A wild attack from the Beast. +1 ATK for this clash.", imageUrl: clashCardImageUrls[2], dataAiHint: "sharp claws", isHoldable: holdableClashCardIds.has("cl3") },
  ];

  const newCards: GameCard[] = [];
  const startIndex = existingCards.length;
  for (let i = startIndex; i < clashCardImageUrls.length; i++) {
    const cardName = `Clash Card ${i + 1}`;
    const cardId = `cl${i + 1}`;
    newCards.push({
      id: cardId,
      name: cardName,
      type: "Clash",
      deck: "Clash Deck",
      description: "A mysterious clash card has been drawn.",
      imageUrl: clashCardImageUrls[i],
      dataAiHint: "clash beast",
      isHoldable: holdableClashCardIds.has(cardId),
    });
  }
  return [...existingCards, ...newCards];
};


const sampleDecks: { name: string; cards: GameCard[] }[] = [
  {
    name: "Event Deck",
    cards: [
      { id: "ev1", name: "Sudden Gloom", type: "Event", deck: "Event Deck", description: "Darkness falls. All heroes suffer -1 Sanity.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "dark event" },
      { id: "ev2", name: "Whispers in the Dark", type: "Event", deck: "Event Deck", description: "Make a Sanity check (difficulté 3) or lose your next turn.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "eerie whisper" },
      { id: "ev3", name: "A Moment of Respite", type: "Event", deck: "Event Deck", description: "A brief calm. All heroes recover 1 HP.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "calm scene" },
    ],
  },
  {
    name: "Item Deck",
    cards: [
      { id: "it1", name: "Ancient Lantern", type: "Item", deck: "Item Deck", description: "Grants +1 to exploration rolls in dark areas.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "old lantern", isHoldable: true },
      { id: "it2", name: "Blessed Charm", type: "Item", deck: "Item Deck", description: "Once per game, reroll a failed Sanity check.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "holy charm", isHoldable: true },
      { id: "it3", name: "Rusty Shiv", type: "Item", deck: "Item Deck", description: "+1 ATK for one combat. Discard after use.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "rusty knife", isHoldable: true },
    ],
  },
  {
    name: "Madness Deck",
    cards: [
      { id: "md1", name: "Hands of the King", type: "Madness", deck: "Madness Deck", description: "The unseen sovereign extends its influence.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/43nipe84zquo/Hands_of_the_King.png", dataAiHint: "royal horror" },
      { id: "md2", name: "Possalm Vo", type: "Madness", deck: "Madness Deck", description: "Your will is not your own.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/cpw0ilysp86m/Possalm_Vo.png", dataAiHint: "spirit possession" },
      { id: "md3", name: "Falling Star", type: "Madness", deck: "Madness Deck", description: "A cosmic omen of despair.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/ez5ki98cis6f/Falling_Star.png", dataAiHint: "cosmic event" },
      { id: "md4", name: "MK Ultra", type: "Madness", deck: "Madness Deck", description: "Your mind is a fractured landscape.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/nbzc428nj3il/MK_Ultra.png", dataAiHint: "mind control" },
      { id: "md5", name: "Creeping Darkness", type: "Madness", deck: "Madness Deck", description: "Shadows lengthen and sanity wanes.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/ve1le0fptccw/Creeping_Darkness.png", dataAiHint: "dark shadow" },
      { id: "md6", name: "Bella Don", type: "Madness", deck: "Madness Deck", description: "Poisonous thoughts cloud your judgment.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/3bv66ld5b23p/Bella_Don.png", dataAiHint: "toxic plant" },
      { id: "md7", name: "Mad World", type: "Madness", deck: "Madness Deck", description: "Reality itself seems to unravel.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/43tj82lcf9n6/Mad_World.png", dataAiHint: "chaotic world" },
      { id: "md8", name: "You Can Not Escape", type: "Madness", deck: "Madness Deck", description: "The walls are closing in.", imageUrl: "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/riddleofthe-beastcompanionapp-56plcg/assets/w28w5ktrqv84/You_can_not_Escape.png", dataAiHint: "trapped feeling" },
      { id: "md9", name: "Breach", type: "Madness", deck: "Madness Deck", description: "Something has broken through.", imageUrl: "https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/images%2FBreach.png?alt=media&token=8f586d07-30a9-4420-af15-057787aa5d8a", dataAiHint: "dimensional breach" },
    ],
  },
  {
    name: "Clash Deck",
    cards: generateClashCards(),
  },
  {
    name: "Combat Deck",
    cards: [
      { id: "cb1", name: "Power Attack", type: "Combat", deck: "Combat Deck", description: "Hero makes an attack with +2 ATK but -1 DEF this round.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "strong attack" },
      { id: "cb2", name: "Swift Dodge", type: "Combat", deck: "Combat Deck", description: "Hero gains +2 DEF against the next attack this round.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "agile movement" },
      { id: "cb3", name: "Calculated Shot", type: "Combat", deck: "Combat Deck", description: "Hero makes a ranged attack. If successful, +1 damage.", imageUrl: "https://placehold.co/700x1000.png", dataAiHint: "precise aim" },
    ],
  },
];

export function CardGeneratorUI() {
  const [selectedDeck, setSelectedDeck] = useState<string | undefined>(undefined);
  const [drawnCardsHistory, setDrawnCardsHistory] = useState<GameCard[]>([]);
  const [heldCards, setHeldCards] = useState<GameCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const { toast } = useToast();

  const latestCard = drawnCardsHistory.length > 0 ? drawnCardsHistory[0] : null;
  const previousCards = drawnCardsHistory.slice(1); 

  const handleDeckSelection = (deckName: string | undefined) => {
    setSelectedDeck(deckName);
  };

  const generateCard = () => {
    setIsLoading(true);

    if (!selectedDeck) {
      setIsLoading(false);
      toast({ title: "No Deck Selected", description: "Please select a deck to draw from.", variant: "destructive" });
      return;
    }

    const currentDeck = sampleDecks.find(deck => deck.name === selectedDeck);

    if (!currentDeck || currentDeck.cards.length === 0) {
      setIsLoading(false);
      toast({ title: "Empty Deck", description: `The selected deck "${selectedDeck}" is empty.`, variant: "destructive" });
      return;
    }

    const availableCards = currentDeck.cards;

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const newCard = availableCards[randomIndex];

      setDrawnCardsHistory(prevHistory => [newCard, ...prevHistory].slice(0, 3));
      setCardKey(prev => prev + 1);

      if (newCard.isHoldable) {
        setHeldCards(prevHeld => [...prevHeld, newCard]);
        toast({ title: "Card Drawn & Held", description: `${newCard.name} shown and added to your hand.` });
      } else {
        toast({ title: "Card Drawn", description: `${newCard.name} has been drawn.` });
      }
      
      setIsLoading(false);
    }, 500);
  };

  const playHeldCard = (cardToPlay: GameCard) => {
    setHeldCards(prevHeld => prevHeld.filter(card => card.id !== cardToPlay.id));
    setDrawnCardsHistory(prevHistory => [cardToPlay, ...prevHistory].slice(0, 3));
    setCardKey(prev => prev + 1);
    toast({ title: "Card Played", description: `${cardToPlay.name} has been played from your hand.` });
  };

  const resetGenerator = () => {
    setSelectedDeck(undefined);
    setDrawnCardsHistory([]);
    setHeldCards([]);
    setIsLoading(false);
    toast({ title: "Generator Reset", description: "Deck selection, drawn cards, and held cards have been cleared." });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <Card className="md:col-span-1 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
             <Layers className="mr-3 h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Card Decks</CardTitle>
          </div>
          <CardDescription>Select which deck to draw from.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="deck-select">Select a Deck:</Label>
          <Select value={selectedDeck} onValueChange={handleDeckSelection}>
            <SelectTrigger id="deck-select" className="w-full">
              <SelectValue placeholder="Choose a deck..." />
            </SelectTrigger>
            <SelectContent>
              {sampleDecks.map(deck => (
                <SelectItem key={deck.name} value={deck.name}>
                  {deck.name} ({deck.cards.length} cards)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button onClick={generateCard} size="lg" className="w-full bg-primary hover:bg-primary/90" disabled={!selectedDeck || isLoading}>
            <Shuffle className="mr-2 h-5 w-5" /> {isLoading ? "Drawing..." : "Draw Random Card"}
          </Button>
           <Button variant="outline" onClick={resetGenerator} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </CardFooter>

        <Separator className="my-4 mx-6" />

        <CardHeader className="pt-0 px-6">
          <div className="flex items-center">
            <Hand className="mr-3 h-7 w-7 text-primary" />
            <CardTitle className="text-xl">Held Cards</CardTitle>
          </div>
          <CardDescription>Cards you can play later.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {heldCards.length === 0 ? (
            <Alert variant="default" className="text-center border-dashed border-muted-foreground/50">
              <Hand className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <AlertTitle className="text-sm">No Cards Held</AlertTitle>
              <AlertDescription className="text-xs">
                Cards marked as "holdable" will appear here when drawn.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[250px] pr-3">
              <div className="space-y-3">
                {heldCards.map((card, index) => (
                  <Card 
                    key={`${card.id}-held-${index}`} 
                    className="bg-card/80 border-primary/60 shadow-md hover:shadow-primary/40 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer group"
                    onClick={() => playHeldCard(card)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') playHeldCard(card); }}
                  >
                    {card.imageUrl && (
                      <div className="relative w-full aspect-[5/7] overflow-hidden rounded-t-md">
                        <Image
                          src={card.imageUrl}
                          alt={card.name}
                          fill
                          sizes="150px"
                          style={{ objectFit: "contain" }}
                          data-ai-hint={`${card.dataAiHint} held`}
                        />
                      </div>
                    )}
                    <CardHeader className="p-2 pb-1">
                      <CardTitle className="text-base text-primary truncate group-hover:underline">{card.name}</CardTitle>
                      <CardDescription className="text-xs">Type: {card.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <p className="text-xs text-muted-foreground truncate mb-1">{card.description}</p>
                       <Button variant="link" size="sm" className="p-0 h-auto text-xs text-accent group-hover:text-accent-foreground" tabIndex={-1}>
                         Click to Play
                       </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-xl min-h-[500px] flex flex-col justify-start items-center">
        <CardHeader className="w-full text-center">
           <CardTitle className="text-2xl">Generated Card</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-start w-full p-4">
          {isLoading && !latestCard && heldCards.length === 0 ? (
            <div className="space-y-4 w-full max-w-xs">
              <Skeleton className="h-[420px] w-[300px] rounded-lg mx-auto aspect-[5/7]" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          ) : latestCard ? (
            <>
              <Card key={cardKey} className="w-full max-w-[300px] sm:max-w-sm md:max-w-md bg-card/80 border-primary shadow-lg animate-in fade-in-50 zoom-in-90 duration-500">
                {latestCard.imageUrl && (
                  <div className="relative w-full aspect-[5/7] overflow-hidden rounded-t-lg">
                    <Image
                      src={latestCard.imageUrl}
                      alt={latestCard.name}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 300px"
                      style={{ objectFit: "contain" }}
                      data-ai-hint={latestCard.dataAiHint}
                      priority={true}
                    />
                  </div>
                )}
                <CardHeader className="pt-4">
                  <CardTitle className="text-xl text-primary">{latestCard.name}</CardTitle>
                  <CardDescription className="text-sm">Type: {latestCard.type} (From: {latestCard.deck})</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{latestCard.description}</p>
                </CardContent>
              </Card>

              {previousCards.length > 0 && (
                <div className="w-full max-w-xl mt-8">
                  <h4 className="text-lg font-semibold mb-3 text-center text-muted-foreground">Previously Drawn</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {previousCards.map((card, index) => (
                      <Card key={`${card.id}-hist-${index}`} className="bg-card/60 border-muted-foreground/30 shadow-sm overflow-hidden">
                        {card.imageUrl && (
                          <div className="relative w-full aspect-[5/7] overflow-hidden rounded-t-md">
                            <Image
                              src={card.imageUrl}
                              alt={card.name}
                              fill
                              sizes="(max-width: 640px) 40vw, 150px"
                              style={{ objectFit: "contain" }}
                              data-ai-hint={`${card.dataAiHint} history`}
                            />
                          </div>
                        )}
                        <CardHeader className="p-2">
                          <CardTitle className="text-sm text-primary truncate">{card.name}</CardTitle>
                          <CardDescription className="text-xs">Type: {card.type}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                          <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
             <Alert variant="default" className="max-w-md text-center border-dashed border-muted-foreground/50 mt-10">
              <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <AlertTitle>No Card Drawn Yet</AlertTitle>
              <AlertDescription>
                Select decks and click "Draw Random Card", or play a card from your hand.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

