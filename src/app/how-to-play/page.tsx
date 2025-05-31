
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


const normalizeKey = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[’'´`]/g, "") 
    .replace(/&amp;/g, 'and')
    .replace(/[^\w\s-]|_/g, "") 
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-')   
    .replace(/^-+|-+$/g, ''); 
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
    // Split by newline for <br /> tags, then process each line for dangerouslySetInnerHTML
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
  let currentKey: string | null = null;
  let currentContentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (currentKey && currentContentLines.length > 0) {
        lookup.set(currentKey, [...currentContentLines]);
      }
      currentKey = normalizeKey(headingMatch[2].trim());
      currentContentLines = []; // Reset for the new heading
    } else if (currentKey) {
      // Only add non-empty lines or lines that are part of a list context
      // (this simplistic check might need refinement if lists are not directly under headings)
      currentContentLines.push(line);
    }
  }
  // Add content for the last heading in the file
  if (currentKey && currentContentLines.length > 0) {
    lookup.set(currentKey, currentContentLines);
  }
  return lookup;
};


const parseStructureAndMergeContent = (
  structureMarkdown: string,
  mainRulebookLookup: Map<string, string[]>
): Section[] => {
  const sections: Section[] = [];
  if (!structureMarkdown) return sections;

  const lines = structureMarkdown.split('\n');
  let currentH2Section: Section | null = null;
  keyCounter = 0; 

  const addContentFromMainRulebook = (originalHeading: string, section: Section, isListContext: boolean = false) => {
    const normalizedLookupKey = normalizeKey(originalHeading);
    
    if (shopSectionTitlesToIgnore.includes(normalizedLookupKey)) {
      return; // Skip ignored sections
    }

    const contentLines = mainRulebookLookup.get(normalizedLookupKey);

    if (contentLines && contentLines.length > 0) {
      let paragraphBuffer: string[] = [];
      let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[][] } | null = null;

      const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
          const text = paragraphBuffer.join('\n').trim();
          if (text) {
            section.contentNodes.push({
              type: 'p',
              content: parseInlineMarkdown(text, generateNodeKey(`p-main-${section.id}`)),
              key: generateNodeKey(`p-key-main-${section.id}`),
            });
          }
          paragraphBuffer = [];
        }
      };

      const flushList = () => {
        if (listBuffer) {
          section.contentNodes.push({
            type: listBuffer.type,
            items: [...listBuffer.items],
            key: generateNodeKey(`list-main-${listBuffer.type}-${section.id}`),
          });
        }
        listBuffer = null;
      };

      for (const line of contentLines) {
        const trimmedLine = line.trim();
        const ulMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
        const olMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
        const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)/);

        if (imgMatch) {
          flushParagraph(); flushList();
          section.contentNodes.push({
            type: 'img',
            src: imgMatch[2],
            alt: imgMatch[1] || 'Rulebook image from main',
            key: generateNodeKey(`img-main-${section.id}`),
          });
        } else if (ulMatch || olMatch) {
          flushParagraph();
          const itemText = ulMatch ? ulMatch[1] : (olMatch ? olMatch[1] : '');
          const currentListType = ulMatch ? 'ul' : 'ol';
          if (!listBuffer || listBuffer.type !== currentListType) {
            flushList();
            listBuffer = { type: currentListType, items: [] };
          }
          listBuffer.items.push(parseInlineMarkdown(itemText, generateNodeKey(`li-main-${section.id}`)));
        } else if (trimmedLine === '') { // Empty line signifies a paragraph break
          flushParagraph();
          flushList();
        } else { // Non-empty, non-list, non-image line
          flushList(); // If we were in a list, flush it
          paragraphBuffer.push(line);
        }
      }
      flushParagraph();
      flushList();
    } else if (!isListContext) { // Only show debug for non-list-item contexts
       section.contentNodes.push({
          type: 'p',
          content: parseInlineMarkdown(
            `_Debug: Key "${normalizedLookupKey}" (from "${originalHeading}") not found in main rulebook lookup, or its content was empty._`,
            generateNodeKey(`p-debug-${section.id}`)
          ),
          key: generateNodeKey(`p-key-debug-${section.id}`),
       });
    }
  };


  for (const line of lines) {
    const trimmedLine = line.trim();
    const h2Match = trimmedLine.match(/^##\s+(.*)/);
    const h3Match = trimmedLine.match(/^###\s+(.*)/);
    const listItemMatch = trimmedLine.match(/^(\s*[\-\*]|\s*\d+\.)\s+(.*)/);

    if (h2Match) {
      if (currentH2Section) sections.push(currentH2Section);
      const title = h2Match[1].trim();
      const normalizedTitleKey = normalizeKey(title);
      if (shopSectionTitlesToIgnore.includes(normalizedTitleKey)) {
        currentH2Section = null; continue;
      }
      currentH2Section = {
        id: generateNodeKey(`section-h2-${normalizedTitleKey}`),
        title: title,
        contentNodes: [],
      };
      addContentFromMainRulebook(title, currentH2Section);
    } else if (h3Match && currentH2Section) {
      const title = h3Match[1].trim();
      const normalizedTitleKey = normalizeKey(title);
      if (shopSectionTitlesToIgnore.includes(normalizedTitleKey)) continue;
      currentH2Section.contentNodes.push({
        type: 'h3',
        content: parseInlineMarkdown(title, generateNodeKey(`h3-title-${currentH2Section.id}`)),
        key: generateNodeKey(`h3-key-${currentH2Section.id}`),
      });
      addContentFromMainRulebook(title, currentH2Section);
    } else if (listItemMatch && currentH2Section) {
      const itemText = listItemMatch[2].trim();
      // Render list items directly from the structure file.
      // If these items *also* correspond to headings in the main rulebook, 
      // their detailed content would have been pulled by their parent H2/H3.
      // Or, if desired, we could try to look them up too:
      // addContentFromMainRulebook(itemText, currentH2Section, true); 
      // For now, just render the list item text itself:
      const listNodeType = listItemMatch[1].match(/\d/) ? 'ol' : 'ul';
      const lastNode = currentH2Section.contentNodes[currentH2Section.contentNodes.length -1];
      if (lastNode?.type === listNodeType) {
        lastNode.items?.push(parseInlineMarkdown(itemText, generateNodeKey(`li-struct-${currentH2Section.id}`)));
      } else {
         currentH2Section.contentNodes.push({
           type: listNodeType,
           items: [parseInlineMarkdown(itemText, generateNodeKey(`li-struct-${currentH2Section.id}`))],
           key: generateNodeKey(`list-${listNodeType}-${currentH2Section.id}`),
         });
      }
    } else if (trimmedLine === '' && currentH2Section) {
      // Represents a potential paragraph break in the structure file, handled by main content fetching
    } else if (currentH2Section && trimmedLine) {
      // Plain text lines in the structure file.
      // We'll assume these are secondary to the main rulebook's detailed content.
      // To display them:
      // currentH2Section.contentNodes.push({
      //   type: 'p',
      //   content: parseInlineMarkdown(trimmedLine, generateNodeKey(`p-struct-${currentH2Section.id}`)),
      //   key: generateNodeKey(`p-key-struct-${currentH2Section.id}`),
      // });
    }
  }
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
  let structureFileContent = "";
  let mainRulebookFileContent = "";
  let sections: Section[] = [];
  let errorMessage: string | null = null;
  
  try {
    const structureFilePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md');
    structureFileContent = await fs.readFile(structureFilePath, 'utf8');
    
    const mainRulebookFilePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    mainRulebookFileContent = await fs.readFile(mainRulebookFilePath, 'utf8');

  } catch (error: any) {
    console.error("Failed to read rulebook files for How to Play:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        errorMessage = `Error: A rulebook file was not found. Please check the 'docs' directory. Missing: ${error.path.includes('RoTB_Rulebook_Dropdown_Structure.md') ? 'RoTB_Rulebook_Dropdown_Structure.md' : (error.path.includes('Riddle_of_the_Beast_Rulebook.md') ? 'Riddle_of_the_Beast_Rulebook.md' : 'Unknown File')}.`;
    } else {
        errorMessage = `Error loading or processing game rules: ${error.message}. Please check the server logs.`;
    }
  }

  if (!errorMessage) {
    if (!structureFileContent.trim()) {
      errorMessage = "Error: The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) is empty.";
    } else if (!mainRulebookFileContent.trim()) {
      errorMessage = "Error: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) is empty.";
    } else {
      const mainRulebookLookup = buildMainRulebookLookup(mainRulebookFileContent);
      if (mainRulebookLookup.size === 0 && mainRulebookFileContent.includes("##")) { // Check if content has headings but lookup is empty
        errorMessage = "Error: Could not parse any headings from the main rulebook content file (Riddle_of_the_Beast_Rulebook.md), though it seems to contain Markdown headings. Check heading format (e.g., ## Heading) and parser logic.";
      } else if (mainRulebookLookup.size === 0) {
         errorMessage = "Warning: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) does not appear to contain any recognizable Markdown headings (e.g., ## Heading). Detailed content might be missing.";
         // Proceed to parse structure only if main rulebook has no headings.
         sections = parseStructureAndMergeContent(structureFileContent, new Map()); // Pass empty map
      }
      
      if (!errorMessage) { // Only parse if main rulebook lookup was successful or deemed not critical
        sections = parseStructureAndMergeContent(structureFileContent, mainRulebookLookup);
        if (sections.length === 0 && structureFileContent.trim()) { // if structure file has content but no sections parsed
          errorMessage = "No displayable sections could be parsed from the rulebook structure file. This might mean all H2 sections were filtered out or the file structure is not as expected (e.g., missing H2s).";
        }
      }
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
             <p className="text-muted-foreground text-center">No rulebook sections to display. The structure file might be empty or incorrectly formatted.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">_This section is defined in the structure but has no further content specified directly within it, or corresponding content was not found in the main rulebook._</p>}
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
