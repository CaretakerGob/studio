
import type { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, MessageSquare, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: 'FAQ - Beast Companion',
  description: 'Frequently Asked Questions about the Beast Companion app and game concepts.',
};

const appFaqs = [
  {
    question: "How do I save my custom character or changes to existing characters?",
    answer: "To save a character, go to the 'Character Sheet' page. Make your changes, and if you are logged in, click the 'Save Character' button at the bottom of the sheet. Your character data will be saved to your account."
  },
  {
    question: "How do I change my profile picture or display name?",
    answer: "Navigate to the 'User Profile' page. If you are logged in, you'll see your current profile details. Click the 'Edit Profile' button to reveal options for changing your display name and uploading a new profile picture."
  },
  {
    question: "What does the 'Reset Template' button on the Character Sheet do?",
    answer: "The 'Reset Template' button reverts the currently displayed character to its original default stats, skills, and abilities as defined by its base template. This action only affects the character sheet you are viewing and does not delete or alter any character data you have previously saved to your account."
  },
  {
    question: "How does the Card Generator work? Can I hold cards?",
    answer: "The Card Generator allows you to draw random cards from various game decks. First, select a deck from the dropdown menu. Then, click 'Draw Random Card'. Some cards are marked as 'holdable' (often items or specific clash cards). When drawn, holdable cards will appear in the main display area and also be added to your 'Held Cards' section. You can 'play' a held card by clicking on it in that section, which will move it to the main display as the most recent card."
  },
  {
    question: "My Google Sheet data for Events or Investigations isn't showing up. What's wrong?",
    answer: "This usually indicates an issue with your environment variable setup or Google Sheet sharing permissions. Please double-check the following:\n1. Your `.env.local` file (in the project root) has the correct `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `YOUR_SHEET_ID` (e.g., `EVENTS_GOOGLE_SHEET_ID`), and `YOUR_SHEET_RANGE` (e.g., `EVENTS_GOOGLE_SHEET_RANGE`).\n2. The Google Sheet ID and Range are correct for the specific data you're trying to load.\n3. The Google Sheet has been shared with the `GOOGLE_SERVICE_ACCOUNT_EMAIL` with at least 'Viewer' permissions.\n4. You have restarted your Next.js development server after making any changes to the `.env.local` file."
  },
  {
    question: "How do I use the 'Shared Space'?",
    answer: "The 'Shared Space' is a feature for collaborative play. To join a session, you need an access code from the session host. Enter this code on the Shared Space page. Currently, the access code is hardcoded as 'BEAST_PARTY' for demonstration purposes. In a full implementation, hosts would generate unique codes."
  }
];

const gameConceptFaqs = [
  {
    question: "What does 'CP' stand for on the Character Sheet?",
    answer: "CP stands for Character Points. These are used by 'Custom Characters' to purchase or upgrade stats and skills, and by pre-defined characters as a general measure of their starting build value. Pre-defined characters typically have a fixed set of abilities and stats corresponding to their CP."
  },
  {
    question: "How are skill checks typically resolved in the game?",
    answer: "While the app doesn't enforce game rules, skill checks usually involve rolling a die (often a d6) and adding your character's relevant skill level. If the total meets or exceeds a target number set by the game master or scenario, the check is successful. Some events or items in the app might reference skill checks (e.g., 'Occult or Survival (3+)')."
  },
  {
    question: "What do the different combat dice faces mean?",
    answer: "The combat dice have three types of faces:\n- Sword & Shield: Represents a standard hit or a defensive success.\n- Double Sword: Represents a critical hit or a stronger offensive success.\n- Blank: Represents a miss or failure.\nThe exact interpretation depends on the specific game rules for attacks, defense, or other actions involving combat dice."
  },
  {
    question: "How do 'Actions', 'Interrupts', and 'Passives' work for abilities?",
    answer: "These are common ability types:\n- Actions: Usually can only be performed on your character's turn and may consume their main action for that turn.\n- Interrupts: Can often be used outside of your turn, typically in reaction to an event or another player's action. They might have limited uses or cooldowns.\n- Passives: Provide continuous benefits or effects that are always active and don't require a specific trigger to use.\n- FREE Actions: These are special actions that usually don't consume your main turn action, allowing for more flexibility."
  },
  {
    question: "What's the difference between 'Chaos' and 'Order' events?",
    answer: "In the context of the 'Events' generator, 'Chaos' events often represent more unpredictable, dangerous, or negative outcomes, while 'Order' events might represent more structured, beneficial, or neutral outcomes. The specific color (e.g., Black Chaos, Blue Order) further refines the theme or type of event drawn."
  },
  {
    question: "What are 'Arsenals' and how do they affect my character?",
    answer: "Arsenals are equipment loadouts or special kits that a character can equip. When an Arsenal is selected on the Character Sheet, it can:\n- Provide global stat modifications to the character.\n- Grant specific weapons that override the character's base weapons.\n- Provide gear with unique effects or stat changes.\n- Grant new abilities (Actions, Interrupts, Passives, Free Actions).\n- Include a companion (pet) with its own stats and abilities."
  }
];

export default function FaqPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <HelpCircle className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-5xl font-bold text-primary">FAQ</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about the Beast Companion application and general game concepts.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <MessageSquare className="h-7 w-7 text-primary mr-2" />
              <CardTitle className="text-2xl">App Questions</CardTitle>
            </div>
            <CardDescription>Questions related to using the Beast Companion app.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {appFaqs.map((faq, index) => (
                <AccordionItem value={`app-item-${index}`} key={`app-faq-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary">{faq.question}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <BookOpen className="h-7 w-7 text-primary mr-2" />
              <CardTitle className="text-2xl">Board Game Concepts</CardTitle>
            </div>
            <CardDescription>General questions about game mechanics reflected in the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {gameConceptFaqs.map((faq, index) => (
                <AccordionItem value={`game-item-${index}`} key={`game-faq-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary">{faq.question}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
