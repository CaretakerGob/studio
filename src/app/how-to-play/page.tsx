
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
  type: 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'ul' | 'ol' | 'hr' | 'img' | 'br';
  content?: React.ReactNode[];
  src?: string;
  alt?: string;
  items?: React.ReactNode[][]; // For ul/ol, array of arrays of nodes
  key: string;
}

interface Section {
  id: string;
  title: string; // H2 title for AccordionTrigger
  contentNodes: SectionNode[]; // Content under this H2, including H3s and their content
}

const normalizeKey = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// List of heading titles (after normalization) from the main rulebook that should be ignored
const shopSectionTitlesToIgnore = [
  "defense-gear-shop", "melee-weapons", "melee-weapon-shop", "melee-weapon-shop-continued",
  "range-weapons", "range-weapon-shop", "range-weapon-shop-continued",
  "upgrades", "augment-shop", "utility-shop", "consumable-shop", "relics", // Relics* becomes relics
  "loot-table", "mystery-table", "dybbuk-boxes",
  "ammunition", "bombs", "traps", "healing-items", "battery-items", "miscellaneous-items",
  "bleed-threshold-table", "you-are-hunted-table", "maniac-table", "tenebrae-resurrection-table", 
  "bounty-trait-1-table", "bounty-trait-2-table", "rare-bounty-trait-3-table", "pet-rank-table", 
  "renown", "infamy", "order-1d6", "chaos-1d6", "ghoul-table", "killer-plants",
  "drowned-ones", "giant-insects", "possessed-objects", "skirmish-mode-pvp", "skirmish-mode-with-enemy-units", // Specific tables
  "example-armor-types", "weapon-class-special-ability", "gear-and-equipment", "equipment-slots", "gear-shop", "categories",
  "hunter-armor", "enemy-armor", "damage-resolution-steps", "starting-arsenals-listed-below-at-level-1", "leveling-up-starting-arsenals",
  "the-horror-journal", "sample-stat-block", "enemy-targeting-and-movement",
  "what-is-skirmish-mode", "tcp", "forge-map", "select-characters", "set-battle-order", "character-deployment", "battle-for-victory",
  "skirmish-mode-round-order", "welcome-to-your-first-hunt-the-chupacabra", "setup-estimated-time-5-minutes", "select-hunters", "starting-gear", "map-tokens", "light-setting", "cards-needed", "objectives", "round-walkthrough-what-to-do", "initiative-phase", "hunter-round", "enemy-round", "clash-card", "tips-for-first-time-players"
].map(title => normalizeKey(title));


let keyIndex = 0;

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

const buildMainRulebookLookup = (markdown: string): Map<string, string[]> => {
  const lookup = new Map<string, string[]>();
  const lines = markdown.split('\n');
  let currentHeadingKey: string | null = null;
  let currentContentLines: string[] = [];

  const flushContent = () => {
    if (currentHeadingKey && currentContentLines.length > 0) {
      lookup.set(currentHeadingKey, [...currentContentLines]);
    }
    currentContentLines = [];
  };

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      flushContent(); // Flush content for the PREVIOUS heading
      const headingLevel = hMatch[1].length;
      const headingText = hMatch[2].trim();
      currentHeadingKey = normalizeKey(headingText);
      // Do NOT add the heading line itself to currentContentLines for the new key yet
    } else if (currentHeadingKey) {
      // Collect all lines (including empty ones for paragraph breaks, and list/image markdown)
      currentContentLines.push(line);
    }
  }
  flushContent(); // Flush content for the very last heading in the file
  return lookup;
};

const addContentFromMainRulebook = (headingTextForLookup: string, section: Section, mainRulebookLookup: Map<string, string[]>) => {
  const normalizedLookupKey = normalizeKey(headingTextForLookup);

  if (shopSectionTitlesToIgnore.includes(normalizedLookupKey)) {
    // Optionally, add a note that this section is intentionally skipped, or do nothing
    // section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(`_Content for "${headingTextForLookup}" is omitted._`, `skipped-${section.id}-${keyIndex}`), key: `skipped-key-${keyIndex++}` });
    return;
  }

  const mainContentLines = mainRulebookLookup.get(normalizedLookupKey);

  if (!mainContentLines || mainContentLines.length === 0 || mainContentLines.every(l => l.trim() === '')) {
    section.contentNodes.push({
      type: 'p',
      content: parseInlineMarkdown(`_No detailed content found for "${headingTextForLookup}" in the main rulebook, or key mismatch._`, `placeholder-${section.id}-${keyIndex}`),
      key: `main-placeholder-key-${keyIndex++}`,
    });
    return;
  }

  let paragraphBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItemsBuffer: string[] = []; // Buffer for current list item's lines

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const paragraphText = paragraphBuffer.join('\n').trim();
      if (paragraphText) {
        section.contentNodes.push({
          type: 'p',
          content: parseInlineMarkdown(paragraphText, `main-p-${section.id}-${keyIndex}`),
          key: `main-p-key-${keyIndex++}`,
        });
      }
      paragraphBuffer = [];
    }
  };
  
  const flushListItem = () => {
    if (listItemsBuffer.length > 0 && listType) {
       // Check if the last node was a list of the same type to append, or create new
      const lastNode = section.contentNodes[section.contentNodes.length - 1];
      const parsedItemContent = parseInlineMarkdown(listItemsBuffer.join('\n').trim(), `main-li-text-${section.id}-${keyIndex}`);
      
      if (lastNode && lastNode.type === listType && lastNode.items) {
        lastNode.items.push(parsedItemContent);
      } else {
        section.contentNodes.push({ type: listType, items: [parsedItemContent], key: `main-list-${listType}-${section.id}-${keyIndex++}` });
      }
      listItemsBuffer = [];
    }
  };

  const flushList = () => {
    flushListItem(); // Ensure last item of a list is flushed
    listType = null;
  };


  for (const line of mainContentLines) {
    const trimmedLine = line.trim();
    const ulMatch = trimmedLine.match(/^(\s*[\-\*])\s+(.*)/); // Handles indented list items
    const olMatch = trimmedLine.match(/^(\s*\d+\.)\s+(.*)/); // Handles indented list items
    const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)/);

    if (imgMatch) {
      flushParagraph();
      flushList();
      section.contentNodes.push({
        type: 'img',
        src: imgMatch[2],
        alt: imgMatch[1] || 'Rulebook image',
        key: `main-img-${section.id}-${keyIndex++}`,
      });
    } else if (ulMatch || olMatch) {
      flushParagraph();
      const itemText = ulMatch ? ulMatch[2] : olMatch![2];
      const currentItemType = ulMatch ? 'ul' : 'ol';

      if (listType !== currentItemType) { // New list type or start of a new list
        flushList(); // Flush previous list if any
        listType = currentItemType;
      } else { // Same list type, could be a new item or continuation of previous
         flushListItem(); // Flush the previous item before starting a new one
      }
      listItemsBuffer.push(itemText); // Start buffering for the new item
    } else if (trimmedLine === '---') {
      flushParagraph();
      flushList();
      section.contentNodes.push({ type: 'hr', key: `main-hr-${section.id}-${keyIndex++}` });
    } else if (!trimmedLine && paragraphBuffer.length > 0) { // Empty line likely indicates a paragraph break
      flushList(); // End any list before a paragraph break
      flushParagraph();
    } else if (trimmedLine) { // Non-empty, non-list, non-image, non-hr line
      flushList(); // End any list if we encounter regular text
      paragraphBuffer.push(line); // Collect line for paragraph
    } else { // Potentially an empty line not after a paragraph - just continue collecting for current paragraph or list item
        if (listItemsBuffer.length > 0) { // If we are in a list item, empty lines are part of it
            listItemsBuffer.push(line);
        } else { // Otherwise, part of paragraph
            paragraphBuffer.push(line);
        }
    }
  }
  flushList(); // Flush any remaining list
  flushParagraph(); // Flush any remaining paragraph
};


const parseStructureAndMergeContent = (structureMarkdown: string, mainRulebookLookup: Map<string, string[]>): Section[] => {
  const sections: Section[] = [];
  let currentH2Section: Section | null = null;
  const lines = structureMarkdown.split('\n');
  keyIndex = 0; // Reset keyIndex for each parse run

  const flushH2Section = () => {
    if (currentH2Section) {
      if (currentH2Section.contentNodes.length > 0 || mainRulebookLookup.has(normalizeKey(currentH2Section.title))) {
         // Only add if it has nodes or potential content from main rulebook (even if lookup fails, placeholder will be added)
        sections.push(currentH2Section);
      }
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
      if (shopSectionTitlesToIgnore.includes(normalizeKey(title))) {
        currentH2Section = null; // Ensure it's null so it's not processed further
        continue; 
      }
      currentH2Section = {
        id: `section-h2-${normalizeKey(title)}-${keyIndex++}`,
        title: title,
        contentNodes: [],
      };
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);
    } else if (h3Match && currentH2Section) {
      const title = h3Match[1].trim();
       if (shopSectionTitlesToIgnore.includes(normalizeKey(title))) {
        continue; 
      }
      // Add H3 title node to the currentH2Section's content
      currentH2Section.contentNodes.push({
        type: 'h3',
        content: parseInlineMarkdown(title, `h3-title-${currentH2Section.id}-${keyIndex}`),
        key: `h3-key-${keyIndex++}`,
      });
      // Add content for this H3 from the main rulebook to currentH2Section
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);
    } else if (currentH2Section && (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine))) {
        // If the structure file itself contains list items under an H2 (and not under an H3 that we are fetching content for),
        // we can choose to render them or assume they are just structural cues for content in the main rulebook.
        // For now, let's assume the main content fetching for H2/H3 should cover these.
        // If these list items from structure *also* need their *own* content lookup, the logic would need more complexity.
        // For simplicity, we will not render list items from the structure file directly if we expect full content from mainRulebookLookup for the parent H2/H3.
        // If a list item's text *is* a heading, `addContentFromMainRulebook` would try to fetch it if called with that list item's text.
        // This path currently doesn't directly add list items from structure file to contentNodes if main content is being fetched.
    }
  }
  flushH2Section(); // Add the last processed H2 section
  return sections;
};


const renderSectionNode = (node: SectionNode): React.ReactNode => {
  switch (node.type) {
    case 'h3':
      return <h3 key={node.key} className="text-xl font-semibold mt-4 mb-2 text-primary/90">{node.content}</h3>;
    case 'h4':
      return <h4 key={node.key} className="text-lg font-medium mt-3 mb-1 text-primary/85">{node.content}</h4>;
    case 'h5':
      return <h5 key={node.key} className="text-base font-medium mt-2 mb-1 text-primary/80">{node.content}</h5>;
    case 'h6':
      return <h6 key={node.key} className="text-sm font-medium mt-1 mb-0.5 text-primary/75">{node.content}</h6>;
    case 'p':
      return <p key={node.key} className="mb-3 leading-relaxed text-foreground/90">{node.content}</p>;
    case 'ul':
      return <ul key={node.key} className="list-disc pl-6 my-3 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ul>;
    case 'ol':
      return <ol key={node.key} className="list-decimal pl-6 my-3 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ol>;
    case 'hr':
      return <Separator key={node.key} className="my-4" />;
    case 'br':
      return <br key={node.key} />;
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
      errorMessage = "Error: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) could not be read or is empty. This file is needed for detailed explanations.";
    }

    if (structureFileContent.length > 0 && !errorMessage) {
      sections = parseStructureAndMergeContent(structureFileContent, mainRulebookLookup);
    } else if (!errorMessage) {
         errorMessage = "Error: The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) could not be read or is empty.";
    }
    
    if (sections.length === 0 && !errorMessage && structureFileContent.length > 0 && mainRulebookFileContent.length > 0) { 
      if (mainRulebookLookup.size === 0 && mainRulebookFileContent.length > 0) {
        errorMessage = "Error: The main rulebook content was read, but no headings could be parsed from it to build the content lookup. Please check its structure (e.g., ensure it uses markdown headings like ## Section Title).";
      } else if (mainRulebookLookup.size > 0) { // Lookup map has entries, but still no sections generated
        errorMessage = "No displayable sections were constructed. This might mean all H2 sections in the structure file were filtered out by the ignore list, or there's a persistent issue matching headings for content.";
      } else { // Default "no sections" message
        errorMessage = "No displayable sections could be parsed from the rulebook. Content might be structured in an unexpected way or is entirely composed of ignored sections.";
      }
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
            errorMessage = `Error loading rulebook file: ${error.message}. Path: ${error.path}`;
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
    
