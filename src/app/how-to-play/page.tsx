
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
  title: string; // H2 title from structure file
  level: number;
  contentNodes: SectionNode[]; // Nodes from structure file AND main rulebook
}

const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
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
    return <span key={currentKey} dangerouslySetInnerHTML={{ __html: segment.replace(/  +/g, ' ') }} />;
  });
};

const normalizeKey = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// Helper to build a lookup map from the main rulebook
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
    let isHeadingLine = false;
    let matchedHeadingText: string | null = null;
    let headingLevel = 0;

    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
        isHeadingLine = true;
        headingLevel = hMatch[1].length;
        matchedHeadingText = hMatch[2];
    }

    if (isHeadingLine && matchedHeadingText) {
      flushMainContent(); 
      currentHeadingKey = normalizeKey(matchedHeadingText);
    } else if (currentHeadingKey) {
      currentContentLines.push(line);
    }
  }
  flushMainContent(); 
  return lookup;
};

const parseStructureAndMergeContent = (structureMarkdown: string, mainRulebookLookup: Map<string, string[]>): Section[] => {
  const lines = structureMarkdown.split('\n');
  const sections: Section[] = [];
  let currentH2Section: Section | null = null;
  let keyIndex = 0;
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: React.ReactNode[][] = [];

  const shopSectionTitlesToIgnore = [ 
    "defense gear shop", "melee weapons", "melee weapon shop", "melee weapon shop (continued…)",
    "range weapons", "range weapon shop", "range weapon shop (continued…)",
    "upgrades", "augment shop", "utility shop", "consumable shop", "relics*", 
    "loot table", "mystery table", "dybbuk boxes",
    "ammunition", "bombs", "traps", "healing items", "battery items", "miscellaneous items",
    "weapon class special ability" 
  ].map(title => normalizeKey(title));

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
  
  const addContentFromMainRulebook = (headingText: string, section: Section | null) => {
    if (!section) return;
    const mainContentLines = mainRulebookLookup.get(normalizeKey(headingText));
    if (mainContentLines) {
      let paragraphBuffer: string[] = [];
      const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
          section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(paragraphBuffer.join('\n'), `main-p-${section.id}-${keyIndex}`), key: `main-p-key-${keyIndex++}` });
          paragraphBuffer = [];
        }
      };

      for (const contentLine of mainContentLines) {
        const trimmedContentLine = contentLine.trim();
        if (!trimmedContentLine) { // Empty line could mean paragraph break
          flushParagraph();
          section.contentNodes.push({type: 'br', key: `main-br-${keyIndex++}`});
        } else if (trimmedContentLine.match(/^[\-\*]\s+.*/)) { // Rudimentary list detection from main
          flushParagraph();
          // For simplicity, treat main rulebook lists as paragraphs for now, or implement full list parsing here
          section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(contentLine, `main-ul-li-${section.id}-${keyIndex}`), key: `main-ul-li-key-${keyIndex++}` });
        } else if (trimmedContentLine.match(/^\d+\.\s+.*/)) { // Rudimentary ordered list
          flushParagraph();
          section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(contentLine, `main-ol-li-${section.id}-${keyIndex}`), key: `main-ol-li-key-${keyIndex++}` });
        } else if (trimmedContentLine.startsWith('---') || trimmedContentLine.startsWith('***') || trimmedContentLine.startsWith('___')) {
          flushParagraph();
          section.contentNodes.push({ type: 'hr', key: `main-hr-${keyIndex++}` });
        } else {
          paragraphBuffer.push(contentLine);
        }
      }
      flushParagraph(); // Flush any remaining paragraph
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
        currentH2Section = null; // Skip this section
      } else {
        currentH2Section = {
          id: `section-h2-${normalizeKey(title)}-${keyIndex++}`,
          title: title,
          level: 2,
          contentNodes: [],
        };
        addContentFromMainRulebook(title, currentH2Section);
      }
      continue;
    }

    if (!currentH2Section) continue;

    const h3Match = trimmedLine.match(/^###\s+(.*)/);
    const ulListItemMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
    const olListItemMatch = trimmedLine.match(/^\d+\.\s+(.*)/);

    if (h3Match) {
      flushListToSection(currentH2Section);
      const title = h3Match[1].trim();
      if (!shopSectionTitlesToIgnore.includes(normalizeKey(title))) {
        currentH2Section.contentNodes.push({ type: 'h3', content: parseInlineMarkdown(title, `h3-title-${currentH2Section.id}-${keyIndex}`), key: `h3-key-${keyIndex++}` });
        addContentFromMainRulebook(title, currentH2Section);
      }
    } else if (ulListItemMatch || olListItemMatch) {
      const itemText = (ulListItemMatch ? ulListItemMatch[1] : olListItemMatch![1]).trim();
      const newListType = ulListItemMatch ? 'ul' : 'ol';
      if (currentListType !== newListType && currentListItems.length > 0) {
         flushListToSection(currentH2Section);
      }
      currentListType = newListType;
      const listItemNodes = parseInlineMarkdown(itemText, `li-text-${currentH2Section.id}-${keyIndex}`);
      currentListItems.push(listItemNodes);
      // Optionally, try to look up itemText in mainRulebookLookup and append if found as a heading
      // This can be complex if itemText is not a heading. For now, structure's list items are primary.
      const mainContentForItem = mainRulebookLookup.get(normalizeKey(itemText));
      if (mainContentForItem) {
        // This adds main content directly after the list item node in currentListItems, which is not ideal.
        // Better: create a sub-section or richer list item node. For now, let's append as paragraphs to the main section.
        mainContentForItem.forEach(cl => {
            if(cl.trim()){ // Only add if content exists
                currentListItems[currentListItems.length-1].push(<div key={`main-li-content-${keyIndex++}`} className="ml-4 mt-1 text-sm text-muted-foreground/80">{parseInlineMarkdown(cl, `main-li-text-${keyIndex}`)}</div>);
            }
        });
      }

    } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
      flushListToSection(currentH2Section);
      currentH2Section.contentNodes.push({ type: 'hr', key: `hr-${keyIndex++}` });
    } else if (trimmedLine && currentH2Section) { // Non-empty line assumed paragraph if not matched above
      flushListToSection(currentH2Section);
      currentH2Section.contentNodes.push({ type: 'p', content: parseInlineMarkdown(trimmedLine, `p-text-${currentH2Section.id}-${keyIndex}`), key: `p-key-${keyIndex++}` });
    }
  }

  flushListToSection(currentH2Section);
  if (currentH2Section) sections.push(currentH2Section);
  
  return sections.filter(section => section.title && (section.contentNodes.length > 0 || mainRulebookLookup.has(normalizeKey(section.title))));
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

  try {
    const structureFilePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md');
    const mainRulebookFilePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    
    const structureFileContent = await fs.readFile(structureFilePath, 'utf8');
    const mainRulebookContent = await fs.readFile(mainRulebookFilePath, 'utf8');

    const mainRulebookLookup = buildMainRulebookLookup(mainRulebookContent);
    sections = parseStructureAndMergeContent(structureFileContent, mainRulebookLookup);

    if (sections.length === 0) {
      if (structureFileContent.length > 0) {
        errorMessage = "No displayable sections could be parsed from the rulebook structure file. This might mean all H2 sections were filtered out, the file structure is not as expected, or no matching content was found in the main rulebook.";
      } else {
        errorMessage = "The rulebook structure file (RoTB_Rulebook_Dropdown_Structure.md) is empty or unreadable.";
      }
    }
  } catch (error: any) {
    console.error("Failed to read or parse game rules:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        errorMessage = `Error: One or both rulebook files not found. Please check paths: ${error.path}`;
    } else {
        errorMessage = "Error loading or processing game rules. Please check the server logs.";
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
            <p className="text-muted-foreground text-center">No rulebook content to display. Please check the files and parsing logic.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">No specific content items found for this section in the structure file or main rulebook.</p>}
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
