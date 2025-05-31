
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
  level?: number;
  items?: React.ReactNode[][];
  key: string;
}

interface Section {
  id: string;
  title: string;
  level: number;
  contentNodes: SectionNode[];
}

const normalizeKey = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const shopSectionTitlesToIgnore = [
  "defense gear shop", "melee weapons", "melee weapon shop", "melee weapon shop (continued…)",
  "range weapons", "range weapon shop", "range weapon shop (continued…)",
  "upgrades", "augment shop", "utility shop", "consumable shop", "relics*", "relics",
  "loot table", "mystery table", "dybbuk boxes",
  "ammunition", "bombs", "traps", "healing items", "battery items", "miscellaneous items",
  // "weapon class special ability" // Decided to keep this one if present under a weapon type
].map(title => normalizeKey(title));

let keyIndex = 0; // Global key index for React nodes

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
  const lines = markdown.split('\n');
  let currentHeadingKey: string | null = null;
  let currentContentLines: string[] = [];

  const flushMainContent = () => {
    if (currentHeadingKey && currentContentLines.length > 0) {
      lookup.set(currentHeadingKey, [...currentContentLines]);
    }
    currentContentLines = [];
  };

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      flushMainContent();
      const headingText = hMatch[2].trim();
      currentHeadingKey = normalizeKey(headingText);
    } else if (currentHeadingKey) {
      currentContentLines.push(line); // Push raw line, includes empty lines for paragraph breaks
    }
  }
  flushMainContent();
  return lookup;
};

const addContentFromMainRulebook = (headingTextForLookup: string, section: Section, mainRulebookLookup: Map<string, string[]>) => {
  const normalizedLookupKey = normalizeKey(headingTextForLookup);
  const mainContentLines = mainRulebookLookup.get(normalizedLookupKey);

  if (!mainContentLines || mainContentLines.length === 0) {
    if (!shopSectionTitlesToIgnore.includes(normalizedLookupKey)) {
      section.contentNodes.push({
        type: 'p',
        content: parseInlineMarkdown(`_No detailed content found for "${headingTextForLookup}" in the main rulebook, or key mismatch._`, `placeholder-${section.id}-${keyIndex}`),
        key: `placeholder-key-${keyIndex++}`,
      });
    }
    return;
  }

  let paragraphBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[][] = [];

  const flushPBuffer = () => {
    if (paragraphBuffer.length > 0) {
      const paragraphText = paragraphBuffer.join('\n').trim(); // Join with \n, then trim
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

  const flushList = () => {
    if (listType && listItems.length > 0) {
      section.contentNodes.push({ type: listType, items: [...listItems], key: `main-list-${keyIndex++}` });
      listItems = [];
    }
    listType = null;
    inList = false;
  };
  
  for (const contentLine of mainContentLines) {
    const trimmedLine = contentLine.trim();
    const ulMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
    const olMatch = trimmedLine.match(/^\d+\.\s+(.*)/);

    if (ulMatch || olMatch) {
      flushPBuffer(); // End current paragraph
      const itemText = ulMatch ? ulMatch[1] : olMatch![1];
      const currentItemType = ulMatch ? 'ul' : 'ol';

      if (!inList || listType !== currentItemType) {
        flushList(); // Flush previous list if type changes or starting new
        inList = true;
        listType = currentItemType;
      }
      listItems.push(parseInlineMarkdown(itemText, `main-li-${section.id}-${keyIndex}`));
    } else if (trimmedLine === '---') { 
        flushPBuffer();
        flushList();
        section.contentNodes.push({ type: 'hr', key: `main-hr-${keyIndex++}` });
    } else if (!trimmedLine && paragraphBuffer.length > 0) { 
        flushPBuffer();
    } else if (trimmedLine) {
        flushList(); // End current list if line is not a list item
        paragraphBuffer.push(contentLine); // Push original line to preserve potential internal newlines for <br>
    }
  }
  flushPBuffer();
  flushList();
};


const parseStructureAndMergeContent = (structureMarkdown: string, mainRulebookLookup: Map<string, string[]>): Section[] => {
  const sections: Section[] = [];
  let currentH2Section: Section | null = null;
  const lines = structureMarkdown.split('\n');

  keyIndex = 0; // Reset global keyIndex for each parse

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const h2Match = trimmedLine.match(/^##\s+(.*)/);
    const h3Match = trimmedLine.match(/^###\s+(.*)/);

    if (h2Match) {
      if (currentH2Section) sections.push(currentH2Section);
      
      const title = h2Match[1].trim();
      const normalizedTitle = normalizeKey(title);

      if (shopSectionTitlesToIgnore.includes(normalizedTitle)) {
        currentH2Section = null; // Skip this H2 section entirely
        continue;
      }

      currentH2Section = {
        id: `section-h2-${normalizedTitle}-${keyIndex++}`,
        title: title,
        level: 2,
        contentNodes: [],
      };
      // Add content for H2 itself from main rulebook, if any exists directly under this H2
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);

    } else if (h3Match && currentH2Section) {
      const title = h3Match[1].trim();
      const normalizedTitle = normalizeKey(title);

      if (shopSectionTitlesToIgnore.includes(normalizedTitle)) {
        // Skip this H3 and its content from main rulebook
        continue;
      }

      currentH2Section.contentNodes.push({
        type: 'h3',
        content: parseInlineMarkdown(title, `h3-title-${currentH2Section.id}-${keyIndex}`),
        key: `h3-key-${keyIndex++}`,
      });
      // Add content for this H3 from main rulebook
      addContentFromMainRulebook(title, currentH2Section, mainRulebookLookup);
    
    } else if (currentH2Section) {
      // This part handles list items from the structure file if any.
      // As per previous discussion, we decided to primarily rely on main rulebook for content.
      // If structure file lists are purely structural and don't need their own lookup, they can be simple text.
      // For now, let's assume structure file list items are just for display and don't fetch more content.
      const ulMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
      const olMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
      if (ulMatch || olMatch) {
        // If we want to render list items from structure file directly:
        // This would require currentH2Section.contentNodes to correctly handle lists.
        // For simplicity and to avoid duplicating list parsing, we'll assume lists under H2/H3
        // are primarily driven by content fetched from main rulebook by addContentFromMainRulebook.
        // If structure file needs its own list items rendered *as text*, they'd be part of a 'p' node.
        // For now, we'll not add these directly to avoid complex list merging.
        // The primary content should come from `addContentFromMainRulebook`.
      }
    }
  }

  if (currentH2Section) sections.push(currentH2Section);
  return sections.filter(section => section.title && section.contentNodes.length > 0);
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
      return <p key={node.key} className="mb-2 leading-relaxed text-foreground/90">{node.content}</p>;
    case 'ul':
      return <ul key={node.key} className="list-disc pl-6 my-2 space-y-1">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ul>;
    case 'ol':
      return <ol key={node.key} className="list-decimal pl-6 my-2 space-y-1">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ol>;
    case 'hr':
      return <Separator key={node.key} className="my-4" />;
    case 'br':
      return <br key={node.key} />;
    case 'img':
      if (node.src) {
        return (
          <span key={node.key} className="block my-2 text-center">
            <Image
              src={node.src}
              alt={node.alt || 'Rulebook image'}
              width={500}
              height={300}
              className="max-w-full h-auto rounded-md border inline-block"
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

  try {
    const structureFilePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md');
    const mainRulebookFilePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');

    structureFileContent = await fs.readFile(structureFilePath, 'utf8');
    mainRulebookFileContent = await fs.readFile(mainRulebookFilePath, 'utf8');

    const mainRulebookLookup = buildMainRulebookLookup(mainRulebookFileContent);
    sections = parseStructureAndMergeContent(structureFileContent, mainRulebookLookup);
    
    if (sections.length === 0 && structureFileContent.length > 0) {
      errorMessage = "No displayable sections could be parsed. This might mean all H2 sections in the structure file were filtered out, the file structure is not as expected, or no matching content headings were found in the main rulebook.";
    }

  } catch (error: any) {
    console.error("Failed to read or parse game rules for How to Play:", error);
    sections = [];
    errorMessage = `Error loading or processing game rules: ${error.message}. Please check the server logs and file paths.`;
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
             <p className="text-muted-foreground text-center">No sections were rendered. Please check the structure and content files, or the ignore filters.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">_No detailed content loaded for this section._</p>}
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
    
