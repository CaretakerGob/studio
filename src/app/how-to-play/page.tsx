
import React from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpenText } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'How to Play - Riddle of the Beast Companion',
  description: 'Learn the rules of the Riddle of the Beast board game.',
};

interface SectionNode {
  type: 'h3' | 'p' | 'ul' | 'ol' | 'hr' | 'img' | 'br';
  content?: React.ReactNode[];
  src?: string;
  alt?: string;
  items?: React.ReactNode[][];
  key: string;
  level?: number;
}

interface Section {
  id: string;
  title: string;
  contentNodes: SectionNode[];
}

let keyCounter = 0;
const generateNodeKey = (prefix: string) => `${prefix}-${keyCounter++}`;

const normalizeKey = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[’'´`]/g, '')
    .replace(/[^\w\s-]|_/g, "")
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Titles from the main rulebook that should be ignored if they appear in structure
const shopSectionTitlesToIgnore = [
  "defense-gear-shop", "melee-weapons", "melee-weapon-shop", "melee-weapon-shop-continued",
  "range-weapons", "range-weapon-shop", "range-weapon-shop-continued",
  "upgrades", "augment-shop", "utility-shop", "consumable-shop", "relics",
  "loot-table", "mystery-table", "dybbuk-boxes",
  "ammunition", "bombs", "traps", "healing-items", "battery-items", "miscellaneous-items",
  "bleed-threshold-table", "you-are-hunted-table", "maniac-table", "tenebrae-resurrection-table",
  "bounty-trait-1-table", "bounty-trait-2-table", "rare-bounty-trait-3-table", "pet-rank-table",
  "renown", "infamy", "order-1d6", "chaos-1d6", "ghoul-table", "killer-plants",
  "drowned-ones", "giant-insects", "possessed-objects", "skirmish-mode-pvp", "skirmish-mode-with-enemy-units",
  "example-armor-types", "weapon-class-special-ability", "gear-and-equipment", "equipment-slots", "gear-shop", "categories",
  "hunter-armor", "enemy-armor", "damage-resolution-steps", "starting-arsenals-listed-below-at-level-1", "leveling-up-starting-arsenals",
  "the-horror-journal", "sample-stat-block", "enemy-targeting-and-movement",
  "what-is-skirmish-mode", "tcp", "forge-map", "select-characters", "set-battle-order", "character-deployment", "battle-for-victory",
  "skirmish-mode-round-order", "welcome-to-your-first-hunt-the-chupacabra", "setup-estimated-time-5-minutes", "select-hunters", "starting-gear", "map-tokens", "light-setting", "cards-needed", "objectives", "round-walkthrough-what-to-do", "initiative-phase", "hunter-round", "enemy-round", "clash-card", "tips-for-first-time-players"
].map(title => normalizeKey(title));


const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
  if (!text) return [];
  const segments = text.split(/(\*\*.*?\*\*|_.*?_|\*.*?\*|`.*?`|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\))/g).filter(Boolean);
  
  return segments.map((segment, index) => {
    const currentKey = `${keyPrefix}-segment-${index}`;
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={currentKey}>{segment.substring(2, segment.length - 2)}</strong>;
    }
    if ((segment.startsWith('*') && segment.endsWith('*') && !segment.startsWith('**')) || (segment.startsWith('_') && segment.endsWith('_') && !segment.startsWith('__'))) {
      return <em key={currentKey}>{segment.substring(1, segment.length - 1)}</em>;
    }
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return <code key={currentKey} className="bg-muted px-1 py-0.5 rounded text-sm">{segment.substring(1, segment.length - 1)}</code>;
    }
    const imageMatch = segment.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      return (
        <span key={currentKey} className="block my-2 text-center">
          <Image
            src={imageMatch[2]}
            alt={imageMatch[1] || 'Rulebook image'}
            width={500}
            height={300}
            className="max-w-full h-auto rounded-md border inline-block"
            data-ai-hint={imageMatch[1] || "rulebook illustration"}
          />
        </span>
      );
    }
    const linkMatch = segment.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return <a href={linkMatch[2]} key={currentKey} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{linkMatch[1]}</a>;
    }
    return segment.split('\n').map((line, lineIdx) => (
      <React.Fragment key={`${currentKey}-line-${lineIdx}`}>
        {lineIdx > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: line.replace(/  +/g, ' ') }} />
      </React.Fragment>
    ));
  });
};

const parseMarkdownToSectionsFromStructureFile = (markdown: string): Section[] => {
  const sections: Section[] = [];
  if (!markdown) return sections;

  const lines = markdown.split('\n');
  let currentH2Section: Section | null = null;
  let currentParagraphLines: string[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: React.ReactNode[][] = [];
  keyCounter = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0 && currentH2Section) {
      const paragraphText = currentParagraphLines.join(' ').trim(); // Join with space, then trim
      if (paragraphText) {
        currentH2Section.contentNodes.push({
          type: 'p',
          content: parseInlineMarkdown(paragraphText, generateNodeKey(`struct-p-${currentH2Section.id}`)),
          key: generateNodeKey(`struct-p-key-${currentH2Section.id}`),
        });
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0 && currentListType && currentH2Section) {
      currentH2Section.contentNodes.push({
        type: currentListType,
        items: [...currentListItems],
        key: generateNodeKey(`struct-list-${currentListType}-${currentH2Section.id}`),
      });
      currentListItems = [];
    }
    currentListType = null;
  };


  for (const line of lines) {
    const trimmedLine = line.trim();

    const h2Match = trimmedLine.match(/^##\s+(.*)/);
    if (h2Match) {
      flushParagraph();
      flushList();
      if (currentH2Section) sections.push(currentH2Section);

      const title = h2Match[1].trim();
      const normalizedTitleKey = normalizeKey(title);
      if (shopSectionTitlesToIgnore.includes(normalizedTitleKey)) {
        currentH2Section = null; // Skip this section entirely
        continue;
      }
      currentH2Section = {
        id: generateNodeKey(`section-h2-${normalizedTitleKey}`),
        title: title,
        contentNodes: [],
      };
      continue;
    }

    if (!currentH2Section) continue; // Skip lines if not under a valid H2 section

    const h3Match = trimmedLine.match(/^###\s+(.*)/);
    if (h3Match) {
      flushParagraph();
      flushList();
      const h3Title = h3Match[1].trim();
      const normalizedH3Key = normalizeKey(h3Title);
      if (shopSectionTitlesToIgnore.includes(normalizedH3Key)) {
        // If H3 is ignored, we don't add its title or content
        continue;
      }
      currentH2Section.contentNodes.push({
        type: 'h3',
        content: parseInlineMarkdown(h3Title, generateNodeKey(`struct-h3-title-${currentH2Section.id}`)),
        key: generateNodeKey(`struct-h3-key-${currentH2Section.id}`),
      });
      continue;
    }
    
    const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
        flushParagraph();
        flushList();
        currentH2Section.contentNodes.push({
            type: 'img',
            src: imgMatch[2],
            alt: imgMatch[1] || 'Rulebook image',
            key: generateNodeKey(`struct-img-${currentH2Section.id}`),
        });
        continue;
    }

    const listItemMatch = trimmedLine.match(/^(\s*[\-\*]|\s*\d+\.)\s+(.*)/);
    if (listItemMatch) {
      flushParagraph();
      const itemText = listItemMatch[2].trim();
      const newListType = listItemMatch[1].match(/\d/) ? 'ol' : 'ul';

      if (currentListType !== newListType && currentListItems.length > 0) {
        flushList(); // Flush previous list if type changes
      }
      currentListType = newListType;
      currentListItems.push(parseInlineMarkdown(itemText, generateNodeKey(`struct-li-text-${currentH2Section.id}`)));
      continue;
    }
    
    if (trimmedLine === '---') {
        flushParagraph();
        flushList();
        currentH2Section.contentNodes.push({ type: 'hr', key: generateNodeKey(`struct-hr-${currentH2Section.id}`) });
        continue;
    }


    if (trimmedLine === '') { // Empty line signifies a paragraph break
      flushParagraph();
      flushList(); // Also flush list if there was one before an empty line
    } else {
      // If we were in a list and now have non-list text, flush the list.
      if (currentListType) {
        flushList();
      }
      currentParagraphLines.push(trimmedLine);
    }
  }

  flushParagraph();
  flushList();
  if (currentH2Section) sections.push(currentH2Section);

  return sections;
};


const renderSectionNode = (node: SectionNode): React.ReactNode => {
  switch (node.type) {
    case 'h3':
      return <h3 key={node.key} className="text-xl font-semibold mt-4 mb-2 text-primary/90">{node.content}</h3>;
    case 'p':
      return <p key={node.key} className="mb-3 leading-relaxed text-foreground/90">{node.content}</p>;
    case 'ul':
      return <ul key={node.key} className="list-disc pl-6 my-3 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ul>;
    case 'ol':
      return <ol key={node.key} className="list-decimal pl-6 my-3 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ol>;
    case 'hr':
      return <Separator key={node.key} className="my-4" />;
    case 'img':
      if (node.src) {
        return (
          <span key={node.key} className="block my-4 text-center">
            <Image
              src={node.src}
              alt={node.alt || 'Rulebook image'}
              width={500}
              height={300}
              className="max-w-full h-auto rounded-md border inline-block shadow-md"
              data-ai-hint={node.alt || "rulebook illustration"}
            />
          </span>
        );
      }
      return null;
    default:
      return null;
  }
};

export default async function HowToPlayPage() {
  let sections: Section[] = [];
  let errorMessage: string | null = null;
  
  try {
    // Only read from the structure file
    const structureFilePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md');
    const structureFileContent = await fs.readFile(structureFilePath, 'utf8');
    
    if (structureFileContent.length > 0) {
      sections = parseMarkdownToSectionsFromStructureFile(structureFileContent);
    } else {
      errorMessage = "Error: The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) could not be read or is empty.";
    }
    
    if (sections.length === 0 && structureFileContent.length > 0 && !errorMessage) {
      errorMessage = "No displayable sections could be parsed from the rulebook structure file. This might mean all H2 sections were filtered out or the file structure is not as expected (e.g., missing H2s).";
    }

  } catch (error: any) {
    console.error("Failed to read or parse game rules for How to Play:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        errorMessage = `Error: The rulebook structure file (${error.path?.includes('RoTB_Rulebook_Dropdown_Structure.md') ? 'RoTB_Rulebook_Dropdown_Structure.md' : 'Unknown File'}) was not found. Please check the 'docs' directory.`;
    } else {
        errorMessage = `Error loading or processing game rules: ${error.message}. Please check the server logs.`;
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center border-b border-border/50 pb-6">
          <div className="flex items-center justify-center mb-4">
            <BookOpenText className="h-12 w-12 text-primary mr-3" />
            <CardTitle className="text-4xl font-bold text-primary">How to Play: Riddle of the Beast</CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            Explore the rules and mechanics of the game, section by section, based on the game's outline.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-4 md:px-8">
          {errorMessage ? (
            <p className="text-destructive text-center">{errorMessage}</p>
          ) : sections.length === 0 ? (
             <p className="text-muted-foreground text-center">No rulebook sections to display. The structure file might be empty or incorrectly formatted.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">_This section is defined in the structure but has no further content specified directly within it._</p>}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    

    