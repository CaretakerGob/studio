
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpenText } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image'; // Added for image rendering

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

// Simplified inline parser
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
            width={500} // Adjust width as needed, or make responsive
            height={300} // Adjust height as needed
            className="max-w-full h-auto rounded-md border inline-block" 
            data-ai-hint={imageMatch[1] || "rulebook illustration"}
          />
        </span>
      );
    }
    const linkMatch = segment.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      // For now, render as text. Could be an <a> tag if needed.
      return <span key={currentKey} className="text-primary hover:underline">{linkMatch[1]}</span>;
    }
    // For HTML entities like &rsquo;
    return <span key={currentKey} dangerouslySetInnerHTML={{ __html: segment }} />;
  });
};


const parseMarkdownToSections = (markdown: string): Section[] => {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentParagraphLines: string[] = [];
  let keyIndex = 0;

  let isIgnoringShopSection = false;
  let ignoredSectionStartLevel = 0; 
  let mainAccordionSectionLevel = 0;

  const shopSectionTitlesToIgnore = [
    "Defense Gear Shop", "Melee Weapons", "Melee Weapon Shop", "Range Weapons", "Range Weapon Shop", 
    "Augment Shop", "Utility Shop", "Consumable Shop", "Relics*", "Loot Table", "Mystery Table" 
    // Added Loot Table and Mystery Table as they are also large tables better suited for specific tools
  ].map(title => title.toLowerCase());

  const flushParagraphToSection = (section: Section | null) => {
    if (isIgnoringShopSection && section?.level !== mainAccordionSectionLevel) { // Don't add paragraphs to ignored sub-sections
      currentParagraphLines = [];
      return;
    }
    if (currentParagraphLines.length > 0 && section) {
      const paragraphText = currentParagraphLines.join('\n').trim();
      if (paragraphText) {
        const uniqueKey = `p-${section.id}-${keyIndex++}`;
        section.contentNodes.push(
          <p key={uniqueKey} className="mb-3 leading-relaxed text-foreground/90">
            {parseInlineMarkdown(paragraphText, uniqueKey)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    let headingLevel = 0;
    let headingText = "";

    if (trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^(#+)\s*(.*)/);
      if (match) {
        headingLevel = match[1].length;
        headingText = match[2].trim();
      }
    }
    
    // Determine if we should stop ignoring content
    if (isIgnoringShopSection) {
      if (headingLevel > 0 && headingLevel <= mainAccordionSectionLevel && 
          !(headingLevel === 3 && shopSectionTitlesToIgnore.includes(headingText.toLowerCase())) &&
          !(headingLevel === 2 && shopSectionTitlesToIgnore.includes(headingText.toLowerCase())) // Also check for H2 ignored tables
          ) {
        isIgnoringShopSection = false; // Stop ignoring if we hit a new main accordion section level or a non-ignored H3+
        ignoredSectionStartLevel = 0;
      } else if (headingLevel > 0 && headingLevel < ignoredSectionStartLevel) {
         // Stop ignoring if we hit a heading of a higher level than the one that started the ignore,
         // unless it's another shop section we want to ignore.
         if (!((headingLevel === 3 || headingLevel === 2) && shopSectionTitlesToIgnore.includes(headingText.toLowerCase()))) {
            isIgnoringShopSection = false;
            ignoredSectionStartLevel = 0;
         }
      } else {
        currentParagraphLines = []; // Still ignoring
        continue;
      }
    }
    
    // Create new accordion section for H1 or H2
    if (headingLevel === 1 || headingLevel === 2) {
      flushParagraphToSection(currentSection);
      if (currentSection) sections.push(currentSection);
      
      const sectionId = `section-${headingText.toLowerCase().replace(/\s+/g, '-')}-${keyIndex++}`;
      currentSection = { id: sectionId, title: headingText, level: headingLevel, contentNodes: [] };
      mainAccordionSectionLevel = headingLevel;

      // Check if this new main section itself should be ignored (e.g. "Loot Table" as H2)
      if (shopSectionTitlesToIgnore.includes(headingText.toLowerCase())) {
        isIgnoringShopSection = true;
        ignoredSectionStartLevel = headingLevel;
        currentParagraphLines = [];
        // Add the section shell so it can be skipped, but don't process its content further if it's a top-level ignored one
        if(currentSection && currentSection.contentNodes.length === 0 && isIgnoringShopSection) {
           // We can choose to add an empty section to show it's skipped or just not add it.
           // For now, let's not add it if it's completely ignored from the start.
           // If we want to show "Content Ignored", we'd add it here with placeholder.
        }
        continue; 
      }

    } else if (currentSection) { // Content for the current accordion section
      // Check for H3 shop sections to ignore
      if (headingLevel === 3 && shopSectionTitlesToIgnore.includes(headingText.toLowerCase())) {
        flushParagraphToSection(currentSection);
        isIgnoringShopSection = true;
        ignoredSectionStartLevel = headingLevel;
        currentParagraphLines = [];
        continue;
      }

      if (isIgnoringShopSection) {
        currentParagraphLines = [];
        continue;
      }

      flushParagraphToSection(currentSection);

      const uniqueKeyPrefix = `${currentSection.id}-${keyIndex++}`;
      if (headingLevel === 3) {
        currentSection.contentNodes.push(<h3 key={`h3-${uniqueKeyPrefix}`} className="text-2xl font-bold mt-5 mb-2 pb-1 border-b border-border text-primary/95">{headingText}</h3>);
      } else if (headingLevel === 4) {
        currentSection.contentNodes.push(<h4 key={`h4-${uniqueKeyPrefix}`} className="text-xl font-semibold mt-4 mb-2 text-primary/90">{headingText}</h4>);
      } else if (headingLevel === 5) {
        currentSection.contentNodes.push(<h5 key={`h5-${uniqueKeyPrefix}`} className="text-lg font-semibold mt-3 mb-1 text-primary/85">{headingText}</h5>);
      } else if (headingLevel === 6) {
        currentSection.contentNodes.push(<h6 key={`h6-${uniqueKeyPrefix}`} className="text-base font-semibold mt-2 mb-1 text-primary/80">{headingText}</h6>);
      } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
        currentSection.contentNodes.push(<Separator key={`hr-${uniqueKeyPrefix}`} className="my-4" />);
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        currentSection.contentNodes.push(
          <li key={`li-${uniqueKeyPrefix}`} className="ml-5 list-disc text-foreground/90 my-1">
            {parseInlineMarkdown(trimmedLine.substring(2), `li-text-${uniqueKeyPrefix}`)}
          </li>
        );
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        currentSection.contentNodes.push(
          <li key={`oli-${uniqueKeyPrefix}`} className="ml-5 list-decimal text-foreground/90 my-1">
            {parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, ''), `oli-text-${uniqueKeyPrefix}`)}
          </li>
        );
      } else if (trimmedLine !== '') {
        currentParagraphLines.push(line);
      }
    }
  }

  flushParagraphToSection(currentSection);
  if (currentSection && (!isIgnoringShopSection || currentSection.contentNodes.length > 0)) {
    sections.push(currentSection);
  }
  
  // Filter out sections that ended up empty because their entire content was ignored
  return sections.filter(section => section.title.trim() !== "" && section.contentNodes.length > 0 || 
                                  // Keep main sections even if empty if they were NOT on ignore list
                                  (section.level <= 2 && !shopSectionTitlesToIgnore.includes(section.title.toLowerCase()))
                        );
};


export default async function HowToPlayPage() {
  let sections: Section[] = [];
  let errorMessage: string | null = null;

  try {
    const filePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    const rulesContent = await fs.readFile(filePath, 'utf8');
    sections = parseMarkdownToSections(rulesContent);
    if (sections.length === 0 && rulesContent.length > 0) {
        errorMessage = "No sections could be parsed from the rulebook. The content might be structured in an unexpected way or is entirely ignored by filters."
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
            <p className="text-muted-foreground text-center">No rulebook content to display.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section, index) => (
                <AccordionItem value={section.id || `section-${index}`} key={section.id || `section-${index}`} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes}
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
