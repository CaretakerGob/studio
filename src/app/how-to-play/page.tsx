
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

interface Section {
  id: string;
  title: string;
  level: number;
  contentNodes: React.ReactNode[];
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
      return <span key={currentKey} className="text-primary hover:underline">{linkMatch[1]}</span>; // Links are styled but not functional as href is not used
    }
    // For general text, replace multiple spaces with a single space for better rendering, and handle newlines via CSS on the <p>
    return <span key={currentKey} dangerouslySetInnerHTML={{ __html: segment.replace(/  +/g, ' ') }} />;
  });
};

const parseMarkdownToSections = (markdown: string): Section[] => {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentMajorSection: Section | null = null;
  let currentParagraphLines: string[] = [];
  let keyIndex = 0;

  let ignoreContentOfCurrentMajorSection = false;
  let ignoreSubLevelContent = false;

  const shopSectionTitlesToIgnore = [
    "defense gear shop", "melee weapons", "melee weapon shop", 
    "range weapons", "range weapon shop", 
    "augment shop", "utility shop", "consumable shop", "relics*", 
    "loot table", "mystery table", "weapon class special ability",
    // Titles from Utility Shop that are H4 but act as main sections to ignore if "Utility Shop" H3 itself wasn't caught
    "ammunition", "bombs", "traps", "healing items", "battery items", "miscellaneous items", 
    "dybbuk boxes" // Added just in case as it's a list of items
  ].map(title => title.toLowerCase());

  const flushParagraph = (targetSection: Section | null) => {
    if (currentParagraphLines.length > 0 && targetSection) {
      const paragraphText = currentParagraphLines.join('\n').trim();
      if (paragraphText) {
        const uniqueKey = `p-${targetSection.id}-${keyIndex++}`;
        targetSection.contentNodes.push(
          <p key={uniqueKey} className="mb-3 leading-relaxed text-foreground/90">
            {parseInlineMarkdown(paragraphText, uniqueKey)}
          </p>
        );
      }
    }
    currentParagraphLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    let headingLevel = 0;
    let headingText = "";

    const headingMatch = trimmedLine.match(/^(#+)\s*(.*)/);
    if (headingMatch) {
      headingLevel = headingMatch[1].length;
      headingText = headingMatch[2].trim();
    }

    if (headingLevel === 1 || headingLevel === 2) {
      flushParagraph(currentMajorSection);
      if (currentMajorSection && !ignoreContentOfCurrentMajorSection) {
        sections.push(currentMajorSection);
      }

      const newSectionTitleLower = headingText.toLowerCase();
      if (shopSectionTitlesToIgnore.includes(newSectionTitleLower)) {
        ignoreContentOfCurrentMajorSection = true;
        currentMajorSection = null;
      } else {
        ignoreContentOfCurrentMajorSection = false;
        const sectionId = `section-${newSectionTitleLower.replace(/\s+/g, '-')}-${keyIndex++}`;
        currentMajorSection = { id: sectionId, title: headingText, level: headingLevel, contentNodes: [] };
      }
      ignoreSubLevelContent = false; // Reset for new major section
    } else {
      if (ignoreContentOfCurrentMajorSection || !currentMajorSection) {
        continue; // Skip content if major section is ignored or doesn't exist
      }

      if (headingLevel >= 3) { // H3, H4, H5, H6
        flushParagraph(currentMajorSection);
        const subHeadingTextLower = headingText.toLowerCase();
        if (shopSectionTitlesToIgnore.includes(subHeadingTextLower)) {
          ignoreSubLevelContent = true;
        } else {
          ignoreSubLevelContent = false;
          const uniqueKeyPrefix = `${currentMajorSection.id}-${keyIndex++}`;
          if (headingLevel === 3) currentMajorSection.contentNodes.push(<h3 key={`h3-${uniqueKeyPrefix}`} className="text-2xl font-bold mt-5 mb-2 pb-1 border-b border-border text-primary/95">{headingText}</h3>);
          else if (headingLevel === 4) currentMajorSection.contentNodes.push(<h4 key={`h4-${uniqueKeyPrefix}`} className="text-xl font-semibold mt-4 mb-2 text-primary/90">{headingText}</h4>);
          else if (headingLevel === 5) currentMajorSection.contentNodes.push(<h5 key={`h5-${uniqueKeyPrefix}`} className="text-lg font-semibold mt-3 mb-1 text-primary/85">{headingText}</h5>);
          else if (headingLevel === 6) currentMajorSection.contentNodes.push(<h6 key={`h6-${uniqueKeyPrefix}`} className="text-base font-semibold mt-2 mb-1 text-primary/80">{headingText}</h6>);
        }
      } else if (!ignoreSubLevelContent) {
        // Process paragraph lines, list items, separators for the currentMajorSection
        const uniqueKeyPrefix = `${currentMajorSection.id}-${keyIndex++}`;
        if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
          flushParagraph(currentMajorSection);
          currentMajorSection.contentNodes.push(<Separator key={`hr-${uniqueKeyPrefix}`} className="my-4" />);
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          flushParagraph(currentMajorSection);
          currentMajorSection.contentNodes.push(
            <li key={`li-${uniqueKeyPrefix}`} className="ml-5 list-disc text-foreground/90 my-1">
              {parseInlineMarkdown(trimmedLine.substring(2), `li-text-${uniqueKeyPrefix}`)}
            </li>
          );
        } else if (trimmedLine.match(/^\d+\.\s/)) {
          flushParagraph(currentMajorSection);
          currentMajorSection.contentNodes.push(
            <li key={`oli-${uniqueKeyPrefix}`} className="ml-5 list-decimal text-foreground/90 my-1">
              {parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, ''), `oli-text-${uniqueKeyPrefix}`)}
            </li>
          );
        } else if (trimmedLine !== '') {
          currentParagraphLines.push(line);
        }
      }
    }
  }

  flushParagraph(currentMajorSection);
  if (currentMajorSection && !ignoreContentOfCurrentMajorSection) {
    sections.push(currentMajorSection);
  }
  
  return sections;
};


export default async function HowToPlayPage() {
  let sections: Section[] = [];
  let errorMessage: string | null = null;
  let rulesContent = "";

  try {
    const filePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    rulesContent = await fs.readFile(filePath, 'utf8');
    sections = parseMarkdownToSections(rulesContent);
    if (sections.length === 0 && rulesContent.length > 0) {
        errorMessage = "No displayable sections could be parsed from the rulebook. Content might be structured in an unexpected way or is entirely composed of ignored sections."
    }
  } catch (error) {
    console.error("Failed to read or parse game rules:", error);
    sections = [];
    errorMessage = "Error loading game rules. Please check the file path and server logs.";
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
            <p className="text-muted-foreground text-center">No rulebook content to display. Check console for parsing details.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section, index) => (
                <AccordionItem value={section.id || `section-${index}`} key={section.id || `section-${index}`} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes : <p className="italic text-muted-foreground">Content for this section is not displayed or has been filtered.</p>}
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

    