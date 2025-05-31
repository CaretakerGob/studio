
import React from 'react'; // Added this import
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
  items?: React.ReactNode[][]; // For ul/ol, each item is an array of ReactNodes
  key: string;
}

interface Section {
  id: string;
  title: string; // H2 title from structure file
  level: number;
  contentNodes: SectionNode[];
}

const normalizeKey = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

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
      // Add line to current content, even if it's an empty line, to preserve paragraph structure.
      currentContentLines.push(line);
    }
  }
  flushMainContent(); // Flush content for the last heading
  return lookup;
};

const parseStructureAndMergeContent = (structureMarkdown: string, mainRulebookLookup: Map<string, string[]>): Section[] => {
  const lines = structureMarkdown.split('\n');
  const sections: Section[] = [];
  let currentH2Section: Section | null = null;
  let keyIndex = 0;

  const shopSectionTitlesToIgnore = [
    "defense gear shop", "melee weapons", "melee weapon shop", "melee weapon shop (continued…)",
    "range weapons", "range weapon shop", "range weapon shop (continued…)",
    "upgrades", "augment shop", "utility shop", "consumable shop", "relics*", "relics",
    "loot table", "mystery table", "dybbuk boxes",
    "ammunition", "bombs", "traps", "healing items", "battery items", "miscellaneous items",
    "weapon class special ability"
  ].map(title => normalizeKey(title));

  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: React.ReactNode[][] = [];

  const flushListToSection = (section: Section | null) => {
    if (section && currentListType && currentListItems.length > 0) {
      section.contentNodes.push({
        type: currentListType,
        items: [...currentListItems],
        key: `${currentListType}-${section.id}-${keyIndex++}`,
      });
    }
    currentListType = null;
    currentListItems = [];
  };

  const addContentFromMainRulebook = (headingTextForLookup: string, section: Section | null) => {
    if (!section) return;
    const normalizedLookupKey = normalizeKey(headingTextForLookup);
    const mainContentLines = mainRulebookLookup.get(normalizedLookupKey);

    if (mainContentLines && mainContentLines.length > 0) {
      let paragraphBuffer: string[] = [];
      const flushPBuffer = () => {
        if (paragraphBuffer.length > 0) {
          const paragraphText = paragraphBuffer.join('\n').trim();
          if (paragraphText) { // Only add if there's actual text
            section.contentNodes.push({
              type: 'p',
              content: parseInlineMarkdown(paragraphText, `main-p-${section.id}-${keyIndex}`),
              key: `main-p-key-${keyIndex++}`,
            });
          }
          paragraphBuffer = [];
        }
      };

      for (const contentLine of mainContentLines) {
        const trimmedLine = contentLine.trim();
        if (!trimmedLine) { // Empty line could be a paragraph break
          flushPBuffer();
        } else {
          paragraphBuffer.push(contentLine);
        }
      }
      flushPBuffer(); // Flush any remaining content for the last paragraph
    }
  };


  for (const line of lines) {
    const trimmedLine = line.trim();
    const h2Match = trimmedLine.match(/^##\s+(.*)/);

    if (h2Match) {
      flushListToSection(currentH2Section);
      if (currentH2Section) sections.push(currentH2Section);

      const title = h2Match[1].trim();
      if (shopSectionTitlesToIgnore.includes(normalizeKey(title))) {
        currentH2Section = null; // Skip this entire section
      } else {
        currentH2Section = {
          id: `section-h2-${normalizeKey(title)}-${keyIndex++}`,
          title: title,
          level: 2,
          contentNodes: [],
        };
        addContentFromMainRulebook(title, currentH2Section); // Add content for H2 from main rulebook
      }
      continue;
    }

    if (!currentH2Section) continue; // Skip if current H2 is ignored or not yet defined

    const h3Match = trimmedLine.match(/^###\s+(.*)/);
    const ulListItemMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
    const olListItemMatch = trimmedLine.match(/^\d+\.\s+(.*)/);

    if (h3Match) {
      flushListToSection(currentH2Section);
      const title = h3Match[1].trim();
      if (!shopSectionTitlesToIgnore.includes(normalizeKey(title))) {
        currentH2Section.contentNodes.push({ type: 'h3', content: parseInlineMarkdown(title, `h3-title-${currentH2Section.id}-${keyIndex}`), key: `h3-key-${keyIndex++}` });
        addContentFromMainRulebook(title, currentH2Section); // Add content for H3 from main rulebook
      }
    } else if (ulListItemMatch || olListItemMatch) {
      const itemText = (ulListItemMatch ? ulListItemMatch[1] : olListItemMatch![1]).trim();
      const newListType = ulListItemMatch ? 'ul' : 'ol';
      if (currentListType !== newListType && currentListItems.length > 0) {
         flushListToSection(currentH2Section);
      }
      currentListType = newListType;
      const parsedListItemContent = parseInlineMarkdown(itemText, `li-text-${currentH2Section.id}-${keyIndex}`);
      currentListItems.push(parsedListItemContent);
      
      // Try to add content for list items if they are also headings in the main book
      addContentFromMainRulebook(itemText, currentH2Section); 

    } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
      flushListToSection(currentH2Section);
      currentH2Section.contentNodes.push({ type: 'hr', key: `hr-${keyIndex++}` });
    } else if (trimmedLine) { 
      // This case is for paragraphs that might be directly in the structure file,
      // or for flushing list items when a paragraph follows.
      // The main content for headings is handled by addContentFromMainRulebook.
      // If a paragraph appears in the structure file under an H2/H3 that ISN'T also in the main rulebook
      // then we add it here. Otherwise, addContentFromMainRulebook handles it.
      if (currentListType) { // If we were in a list, flush it before starting a paragraph.
        flushListToSection(currentH2Section);
      }
      // Only add paragraph if it's not already part of addContentFromMainRulebook logic (which is hard to check here)
      // This simplified approach assumes paragraphs in structure are rare and distinct from main rulebook content.
      // For now, let's rely on addContentFromMainRulebook for primary text content.
      // If structure file itself has unique paragraphs, they might need specific handling.
      // Let's remove direct paragraph adding from here to avoid duplicates, as main content should be fetched by addContentFromMainRulebook
      // currentH2Section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(trimmedLine, `p-text-${currentH2Section.id}-${keyIndex}`), key: `p-key-${keyIndex++}` });
    }
  }

  flushListToSection(currentH2Section);
  if (currentH2Section) sections.push(currentH2Section);

  return sections.filter(section => section.title && section.contentNodes.length > 0); // Only return sections with content
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
      return <ul key={node.key} className="list-disc pl-6 my-2 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ul>;
    case 'ol':
      return <ol key={node.key} className="list-decimal pl-6 my-2 space-y-1.5">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ol>;
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

    if (sections.length === 0) {
      if (structureFileContent.length > 0) {
        errorMessage = "No displayable sections could be parsed. This might mean all H2 sections in the structure file were filtered out, the file structure is not as expected, or no matching content headings were found in the main rulebook.";
      } else {
        errorMessage = "The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) is empty or unreadable.";
      }
    }
  } catch (error: any) {
    console.error("Failed to read or parse game rules for How to Play:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        errorMessage = `Error: One or both rulebook files not found. Please check paths. Structure: ${'docs/RoTB_Rulebook_Dropdown_Structure.md'}, Main: ${'docs/Riddle_of_the_Beast_Rulebook.md'}. Error path: ${error.path}`;
    } else {
        errorMessage = "Error loading or processing game rules. Please check the server logs for details.";
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
          ) : sections.length === 0 && !structureFileContent ? (
            <p className="text-muted-foreground text-center">Rulebook structure file is empty or unreadable.</p>
          ) : sections.length === 0 && structureFileContent ? (
             <p className="text-muted-foreground text-center">No sections were rendered. Check if all H2s in structure are ignored or if no content matched from main rulebook.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">No specific content items found for this section in the structure file, or no detailed text in the main rulebook for this heading.</p>}
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

    
