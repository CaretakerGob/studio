
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
  type: 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'ul' | 'ol' | 'hr' | 'img';
  content?: React.ReactNode[]; // For text nodes, or li for lists
  src?: string; // For img
  alt?: string; // For img
  level?: number; // For headings
  items?: React.ReactNode[][]; // For lists (array of arrays of nodes for each li)
  key: string;
}

interface Section {
  id: string;
  title: string;
  level: number; // H2 level for accordion item
  contentNodes: SectionNode[];
}

const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
  const segments = text.split(/(\*\*.*?\*\*|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|_.*?_|\*.*?\*)/g).filter(Boolean);
  return segments.map((segment, index) => {
    const currentKey = `${keyPrefix}-segment-${index}`;
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={currentKey}>{segment.substring(2, segment.length - 2)}</strong>;
    }
    if ((segment.startsWith('*') && segment.endsWith('*') && !segment.startsWith('**')) || (segment.startsWith('_') && segment.endsWith('_') && !segment.startsWith('__'))) {
      return <em key={currentKey}>{segment.substring(1, segment.length - 1)}</em>;
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
      return <span key={currentKey} className="text-primary hover:underline">{linkMatch[1]}</span>;
    }
    return <span key={currentKey} dangerouslySetInnerHTML={{ __html: segment.replace(/  +/g, ' ') }} />;
  });
};

const parseMarkdownToSectionsFromStructureFile = (markdown: string): Section[] => {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentH2Section: Section | null = null;
  let currentContentNodes: SectionNode[] = [];
  let keyIndex = 0;
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: React.ReactNode[][] = [];

  const shopSectionTitlesToIgnore = [ 
    "defense gear shop", "melee weapons", "melee weapon shop", 
    "range weapons", "range weapon shop", 
    "augment shop", "utility shop", "consumable shop", "relics*", 
    "loot table", "mystery table", "weapon class special ability",
    "ammunition", "bombs", "traps", "healing items", "battery items", "miscellaneous items", 
    "dybbuk boxes"
  ].map(title => title.toLowerCase());

  const flushList = () => {
    if (currentH2Section && currentListType && currentListItems.length > 0) {
      currentContentNodes.push({
        type: currentListType,
        items: [...currentListItems],
        key: `${currentListType}-${keyIndex++}`,
      });
    }
    currentListType = null;
    currentListItems = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    const h1Match = trimmedLine.match(/^#\s+(.*)/);
    const h2Match = trimmedLine.match(/^##\s+(.*)/);
    const h3Match = trimmedLine.match(/^###\s+(.*)/);
    const h4Match = trimmedLine.match(/^####\s+(.*)/);
    const ulListItemMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
    const olListItemMatch = trimmedLine.match(/^\d+\.\s+(.*)/);

    if (h1Match) {
      flushList();
      if (currentH2Section) {
        if (currentContentNodes.length > 0) currentH2Section.contentNodes.push(...currentContentNodes);
        sections.push(currentH2Section);
      }
      currentH2Section = null; 
      currentContentNodes = [];
      continue;
    }
    
    if (h2Match) {
      flushList();
      if (currentH2Section) {
        if (currentContentNodes.length > 0) currentH2Section.contentNodes.push(...currentContentNodes);
        sections.push(currentH2Section);
      }
      currentContentNodes = [];
      const title = h2Match[1].trim();
      if (shopSectionTitlesToIgnore.includes(title.toLowerCase())) {
        currentH2Section = null; // Skip this H2 section
      } else {
        currentH2Section = {
          id: `section-h2-${title.replace(/\s+/g, '-')}-${keyIndex++}`,
          title: title,
          level: 2,
          contentNodes: [],
        };
      }
      continue;
    }

    if (!currentH2Section) continue; // Skip content if not under a valid H2

    // If line is not an H2, it's content for the currentH2Section
    if (ulListItemMatch || olListItemMatch) {
      const itemText = (ulListItemMatch ? ulListItemMatch[1] : olListItemMatch![1]).trim();
      const newListType = ulListItemMatch ? 'ul' : 'ol';
      if (currentListType !== newListType) {
        flushList(); // Flush previous list if type changes
        currentListType = newListType;
      }
      currentListItems.push(parseInlineMarkdown(itemText, `li-text-${keyIndex++}`));
    } else {
      flushList(); // Any non-list item flushes the current list
      if (h3Match) {
        const title = h3Match[1].trim();
        if (!shopSectionTitlesToIgnore.includes(title.toLowerCase())) {
          currentContentNodes.push({ type: 'h3', content: parseInlineMarkdown(title, `h3-title-${keyIndex}`), key: `h3-${keyIndex++}` });
        }
      } else if (h4Match) {
         const title = h4Match[1].trim();
         if (!shopSectionTitlesToIgnore.includes(title.toLowerCase())) {
          currentContentNodes.push({ type: 'h4', content: parseInlineMarkdown(title, `h4-title-${keyIndex}`), key: `h4-${keyIndex++}` });
         }
      } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
        currentContentNodes.push({ type: 'hr', key: `hr-${keyIndex++}` });
      } else if (trimmedLine) { // Treat other non-empty lines as paragraphs
        currentContentNodes.push({ type: 'p', content: parseInlineMarkdown(trimmedLine, `p-text-${keyIndex}`), key: `p-${keyIndex++}` });
      }
    }
  }

  flushList();
  if (currentH2Section) {
    if (currentContentNodes.length > 0) currentH2Section.contentNodes.push(...currentContentNodes);
    if (currentH2Section.title) sections.push(currentH2Section); // Ensure section has a title
  }
  
  return sections.filter(section => section.title && section.contentNodes.length > 0);
};


const renderSectionNode = (node: SectionNode): React.ReactNode => {
  switch (node.type) {
    case 'h3':
      return <h3 key={node.key} className="text-xl font-bold mt-4 mb-2 text-primary/90">{node.content}</h3>;
    case 'h4':
      return <h4 key={node.key} className="text-lg font-semibold mt-3 mb-1 text-primary/85">{node.content}</h4>;
    case 'h5':
      return <h5 key={node.key} className="text-base font-semibold mt-2 mb-1 text-primary/80">{node.content}</h5>;
    case 'h6':
      return <h6 key={node.key} className="text-sm font-semibold mt-1 mb-0.5 text-primary/75">{node.content}</h6>;
    case 'p':
      return <p key={node.key} className="mb-2 leading-relaxed text-foreground/90">{node.content}</p>;
    case 'ul':
      return <ul key={node.key} className="list-disc pl-5 my-2 space-y-1">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ul>;
    case 'ol':
      return <ol key={node.key} className="list-decimal pl-5 my-2 space-y-1">{node.items?.map((itemContent, idx) => <li key={`${node.key}-li-${idx}`}>{itemContent}</li>)}</ol>;
    case 'hr':
      return <Separator key={node.key} className="my-4" />;
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
  let rulesContent = "";

  try {
    const filePath = path.join(process.cwd(), 'docs', 'RoTB_Rulebook_Dropdown_Structure.md'); // Corrected filename
    rulesContent = await fs.readFile(filePath, 'utf8');
    sections = parseMarkdownToSectionsFromStructureFile(rulesContent);
    if (sections.length === 0 && rulesContent.length > 0) {
        errorMessage = "No displayable sections could be parsed from the rulebook structure file. This might mean all H2 sections were filtered out or the file structure is not as expected (e.g., missing H2s)."
    }
  } catch (error) {
    console.error("Failed to read or parse game rules structure:", error);
    sections = [];
    errorMessage = "Error loading game rules structure. Please check the file path and server logs.";
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
            <p className="text-muted-foreground text-center">No rulebook content to display from the structure file. Please check the file and parsing logic.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section, index) => (
                <AccordionItem value={section.id || `section-${index}`} key={section.id || `section-${index}`} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">No specific content items found for this section in the structure file.</p>}
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
    

    
