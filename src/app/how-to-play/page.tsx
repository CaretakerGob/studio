
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
  type: 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'ul' | 'ol' | 'hr' | 'img' | 'br' | 'debug';
  content?: React.ReactNode[];
  src?: string;
  alt?: string;
  items?: React.ReactNode[][];
  key: string;
  level?: number; // For lists
}

interface Section {
  id: string;
  title: string;
  contentNodes: SectionNode[];
}

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

let keyCounter = 0;
const generateNodeKey = (prefix: string) => `${prefix}-${keyCounter++}`;

const normalizeKey = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/&amp;/g, 'and')      // Replace &amp; with 'and'
    .replace(/[’'´`]/g, '')        // Remove various apostrophes (curly, straight, backtick, grave)
    // More aggressive removal of ALL punctuation and symbols EXCEPT hyphens and spaces (which are handled next)
    // This should happen BEFORE replacing spaces with hyphens to avoid creating "--" from "word - word"
    .replace(/[^\w\s-]|_/g, "")    // Remove non-alphanumeric, non-whitespace, non-hyphen. Also removes underscores.
    .trim()                        // Trim leading/trailing whitespace
    .replace(/\s+/g, '-')         // Replace sequences of whitespace with a single hyphen
    .replace(/-+/g, '-')          // Replace multiple hyphens with a single hyphen (e.g., "word---word" to "word-word")
    .replace(/^-+|-+$/g, '');     // Remove leading or trailing hyphens (e.g., "-word-" to "word")
};


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
    // Basic handling for line breaks within paragraphs from main content
    return segment.split('\n').map((line, lineIdx) => (
      <React.Fragment key={`${currentKey}-line-${lineIdx}`}>
        {lineIdx > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: line.replace(/  +/g, ' ') }} />
      </React.Fragment>
    ));
  });
};

const buildMainRulebookLookup = (markdown: string): Map<string, string[]> => {
  const lookup = new Map<string, string[]>();
  if (!markdown) return lookup;

  const lines = markdown.split('\n');
  let currentHeadingKey: string | null = null;
  let currentContentLines: string[] = [];

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,6})\s+(.*)/); // Matches H1-H6
    if (hMatch) {
      // If there was a previous heading, store its collected content
      if (currentHeadingKey && currentContentLines.length > 0) {
        lookup.set(currentHeadingKey, [...currentContentLines]);
      }
      // Start new heading
      currentHeadingKey = normalizeKey(hMatch[2].trim());
      currentContentLines = []; // Reset content for the new heading
    } else if (currentHeadingKey !== null) { // Ensure we are under a heading
      // Collect the line (even if empty, for paragraph breaks needed by addContentFromMainRulebook)
      currentContentLines.push(line);
    }
  }

  // After the loop, store the content for the last heading
  if (currentHeadingKey && currentContentLines.length > 0) {
    lookup.set(currentHeadingKey, [...currentContentLines]);
  }
  return lookup;
};

const addContentFromMainRulebook = (
  headingTextForLookup: string,
  section: Section,
  mainRulebookLookup: Map<string, string[]>
) => {
  const normalizedLookupKey = normalizeKey(headingTextForLookup);

  if (shopSectionTitlesToIgnore.includes(normalizedLookupKey)) {
    return; // Skip ignored sections
  }

  const mainContentLines = mainRulebookLookup.get(normalizedLookupKey);

  if (mainContentLines === undefined) {
    section.contentNodes.push({
      type: 'debug',
      content: parseInlineMarkdown(`_Debug: Key "${normalizedLookupKey}" (from "${headingTextForLookup}") not found in main rulebook lookup._`, generateNodeKey(`main-debug-key-${section.id}`)),
      key: generateNodeKey(`main-debug-key`),
    });
    return;
  }

  if (mainContentLines.length === 0 || mainContentLines.every(l => l.trim() === '')) {
    section.contentNodes.push({
      type: 'debug',
      content: parseInlineMarkdown(`_No detailed content found for "${headingTextForLookup}" in the main rulebook (content was empty)._`, generateNodeKey(`main-placeholder-${section.id}`)),
      key: generateNodeKey(`main-placeholder-key`),
    });
    return;
  }

  let paragraphBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItemsBuffer: React.ReactNode[][] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paragraphText = paragraphBuffer.join('\n').trim();
      if (paragraphText) {
        section.contentNodes.push({
          type: 'p',
          content: parseInlineMarkdown(paragraphText, generateNodeKey(`main-p-${section.id}`)),
          key: generateNodeKey(`main-p-key`),
        });
      }
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listItemsBuffer.length > 0 && listType) {
      section.contentNodes.push({ type: listType, items: [...listItemsBuffer], key: generateNodeKey(`main-list-${listType}-${section.id}`) });
      listItemsBuffer = [];
    }
    listType = null;
  };

  for (const line of mainContentLines) {
    const trimmedLine = line.trim();
    const ulMatch = trimmedLine.match(/^(\s*[\-\*])\s+(.*)/);
    const olMatch = trimmedLine.match(/^(\s*\d+\.)\s+(.*)/);
    const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)/);

    if (imgMatch) {
      flushParagraph();
      flushList();
      section.contentNodes.push({
        type: 'img',
        src: imgMatch[2],
        alt: imgMatch[1] || 'Rulebook image',
        key: generateNodeKey(`main-img-${section.id}`),
      });
    } else if (ulMatch || olMatch) {
      flushParagraph();
      const itemText = ulMatch ? ulMatch[2] : olMatch![2];
      const currentItemType = ulMatch ? 'ul' : 'ol';

      if (listType !== currentItemType) {
        flushList(); // Flush previous list if type changes
        listType = currentItemType;
      }
      listItemsBuffer.push(parseInlineMarkdown(itemText, generateNodeKey(`main-li-text-${section.id}`)));
    } else if (trimmedLine === '---') {
      flushParagraph();
      flushList();
      section.contentNodes.push({ type: 'hr', key: generateNodeKey(`main-hr-${section.id}`) });
    } else if (!trimmedLine) { // Empty line indicates a paragraph break
      flushList(); // Important to flush list before paragraph
      flushParagraph();
    } else { // Non-empty, non-list, non-image, non-hr line
      flushList(); // If we were in a list and now have paragraph text, flush list
      paragraphBuffer.push(line);
    }
  }
  flushList(); // Flush any remaining list items
  flushParagraph(); // Flush any remaining paragraph content
};

const parseStructureAndMergeContent = (structureMarkdown: string, mainRulebookLookup: Map<string, string[]>): Section[] => {
  const sections: Section[] = [];
  if (!structureMarkdown) return sections;

  let currentH2Section: Section | null = null;
  const lines = structureMarkdown.split('\n');
  keyCounter = 0;

  const flushH2Section = () => {
    if (currentH2Section) {
      sections.push(currentH2Section);
      currentH2Section = null;
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const h2Match = trimmedLine.match(/^##\s+(.*)/);
    const h3Match = trimmedLine.match(/^###\s+(.*)/);

    if (h2Match) {
      flushH2Section();
      const title = h2Match[1].trim();
      const normalizedTitleKey = normalizeKey(title);
      if (shopSectionTitlesToIgnore.includes(normalizedTitleKey)) {
        continue;
      }
      currentH2Section = {
        id: generateNodeKey(`section-h2-${normalizedTitleKey}`),
        title: title,
        contentNodes: [],
      };
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);
    } else if (h3Match && currentH2Section) {
      const title = h3Match[1].trim();
      const normalizedTitleKey = normalizeKey(title);
      if (shopSectionTitlesToIgnore.includes(normalizedTitleKey)) {
        continue;
      }
      currentH2Section.contentNodes.push({
        type: 'h3',
        content: parseInlineMarkdown(title, generateNodeKey(`h3-title-${currentH2Section.id}`)),
        key: generateNodeKey(`h3-key`),
      });
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);
    }
    // List items from structure file are no longer directly rendered or used to fetch content independently.
    // Their explanations are expected to be part of the content block fetched for their parent H2 or H3 from the main rulebook.
  }
  flushH2Section();
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
    case 'debug': // For rendering debug messages
      return <p key={node.key} className="text-xs text-destructive italic my-1">{node.content}</p>;
    default:
      return null;
  }
};

export default async function HowToPlayPage() {
  let sections: Section[] = [];
  let errorMessage: string | null = null;
  let structureFileContent = "";
  let mainRulebookFileContent = "";
  let mainRulebookLookup: Map<string, string[]> = new Map();

  try {
    const structureFilePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md');
    structureFileContent = await fs.readFile(structureFilePath, 'utf8');

    const mainRulebookFilePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    mainRulebookFileContent = await fs.readFile(mainRulebookFilePath, 'utf8');
    
    if (mainRulebookFileContent.length > 0) {
      mainRulebookLookup = buildMainRulebookLookup(mainRulebookFileContent);
    } else {
      errorMessage = "Error: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) could not be read or is empty.";
    }

    if (structureFileContent.length > 0 && !errorMessage) {
      sections = parseStructureAndMergeContent(structureFileContent, mainRulebookLookup);
    } else if (!errorMessage) { // structureFileContent is empty but no other error
         errorMessage = "Error: The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) could not be read or is empty.";
    }
    
    if (mainRulebookFileContent.length > 0 && mainRulebookLookup.size === 0 && !errorMessage) {
      errorMessage = "Error: Main rulebook content was read, but no headings could be parsed from it to build the content lookup. Please check its Markdown heading structure (e.g., ensure it uses '## Section Title').";
    } else if (sections.length === 0 && structureFileContent.length > 0 && !errorMessage) { 
      errorMessage = "No displayable sections could be parsed. This might mean all H2 sections in the structure file were filtered out by the ignore list, or there's a persistent issue matching headings for content.";
    }

  } catch (error: any) {
    console.error("Failed to read or parse game rules for How to Play:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        if (error.path?.includes('RoTB_Rulebook_Dropdown_Structure.md')) {
            errorMessage = "Error: The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) was not found. Please check the 'docs' directory.";
        } else if (error.path?.includes('Riddle_of_the_Beast_Rulebook.md')) {
            errorMessage = "Error: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) was not found. Please check the 'docs' directory.";
        } else {
            errorMessage = `Error loading rulebook file: ${error.message}. Path: ${error.path || 'Unknown path'}`;
        }
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
            Explore the rules and mechanics of the game, section by section.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-4 md:px-8">
          {errorMessage ? (
            <p className="text-destructive text-center">{errorMessage}</p>
          ) : sections.length === 0 ? (
             <p className="text-muted-foreground text-center">No sections could be parsed from the rulebook files. The content might be structured in an unexpected way or is entirely composed of ignored sections.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">_This section is defined in the structure but has no further content specified or its content was filtered._</p>}
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
    
