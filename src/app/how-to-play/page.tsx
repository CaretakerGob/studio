
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

// Moved normalizeKey function definition before its use
const normalizeKey = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[’'´`]/g, "") // Remove various apostrophe-like characters
    .replace(/&amp;/g, 'and') // Replace &amp; with 'and'
    .replace(/[^\w\s-]|_/g, "") // Remove punctuation except hyphens and whitespace, also remove underscores
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace whitespace with hyphens
    .replace(/-+/g, '-')   // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// shopSectionTitlesToIgnore is removed for now, as it was based on the structure file.
// We can re-add filtering later if needed, based on actual headings from the main rulebook.
// const shopSectionTitlesToIgnore = [ ... ].map(title => normalizeKey(title));


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
    const imageMatch = segment.match(/^!\[(.*?)\]\((.*?)\)$/);
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

const parseMainRulebookToSections = (markdown: string): Section[] => {
  const sections: Section[] = [];
  if (!markdown) return sections;

  const lines = markdown.split('\n');
  let currentH2Section: Section | null = null;
  let currentContentBuffer: string[] = [];
  keyCounter = 0;

  const flushContentBuffer = (section: Section | null) => {
    if (!section || currentContentBuffer.length === 0) {
      currentContentBuffer = [];
      return;
    }

    let paragraphBuffer: string[] = [];
    let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[][] } | null = null;
    let inList = false;

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
      inList = false;
    };

    currentContentBuffer.forEach(line => {
      const trimmedLine = line.trim();
      const ulMatch = trimmedLine.match(/^[\-\*]\s+(.*)/);
      const olMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
      const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)/);
      const h3Match = trimmedLine.match(/^###\s+(.*)/); // Check for H3s within content

      if (h3Match) {
        flushParagraph(); flushList();
        section.contentNodes.push({
          type: 'h3',
          content: parseInlineMarkdown(h3Match[1].trim(), generateNodeKey(`h3-content-${section.id}`)),
          key: generateNodeKey(`h3-key-content-${section.id}`),
        });
      } else if (imgMatch) {
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
          inList = true;
        }
        listBuffer.items.push(parseInlineMarkdown(itemText, generateNodeKey(`li-main-${section.id}`)));
      } else if (trimmedLine === '') {
        flushParagraph();
        if (inList) flushList();
      } else {
        if (inList) flushList();
        paragraphBuffer.push(line);
      }
    });
    flushParagraph();
    flushList();
    currentContentBuffer = [];
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.*)/);
    const h3Match = line.match(/^###\s+(.*)/); // Also detect H3s at top level if any section isn't active

    if (h2Match) {
      if (currentH2Section) {
        flushContentBuffer(currentH2Section);
        sections.push(currentH2Section);
      }
      const title = h2Match[1].trim();
      // Removed shopSectionTitlesToIgnore check for now
      currentH2Section = {
        id: generateNodeKey(`section-h2-${normalizeKey(title)}`),
        title: title,
        contentNodes: [],
      };
    } else if (h3Match && currentH2Section) {
        flushContentBuffer(currentH2Section); // Flush previous content before adding H3
        currentH2Section.contentNodes.push({
          type: 'h3',
          content: parseInlineMarkdown(h3Match[1].trim(), generateNodeKey(`h3-title-${currentH2Section.id}`)),
          key: generateNodeKey(`h3-key-title-${currentH2Section.id}`),
        });
    } else if (currentH2Section) {
      currentContentBuffer.push(line);
    }
  }

  if (currentH2Section) {
    flushContentBuffer(currentH2Section);
    sections.push(currentH2Section);
  }
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
  let mainRulebookFileContent = "";
  let sections: Section[] = [];
  let errorMessage: string | null = null;
  
  try {
    const mainRulebookFilePath = path.join(process.cwd(), 'docs', 'Riddle_of_the_Beast_Rulebook.md');
    mainRulebookFileContent = await fs.readFile(mainRulebookFilePath, 'utf8');

  } catch (error: any) {
    console.error("Failed to read main rulebook file for How to Play:", error);
    sections = [];
    if (error.code === 'ENOENT') {
        errorMessage = `Error: The main rulebook file (Riddle_of_the_Beast_Rulebook.md) was not found in the 'docs' directory.`;
    } else {
        errorMessage = `Error loading or processing game rules: ${error.message}. Please check the server logs.`;
    }
  }

  if (!errorMessage) {
    if (!mainRulebookFileContent.trim()) {
      errorMessage = "Error: The main rulebook content file (Riddle_of_the_Beast_Rulebook.md) is empty.";
    } else {
      sections = parseMainRulebookToSections(mainRulebookFileContent);
      if (sections.length === 0) {
        errorMessage = "Warning: No H2 sections could be parsed from the main rulebook file. The page might appear empty or not structured as expected. Ensure the rulebook uses '## Heading' for main sections.";
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
            Explore the rules and mechanics of the game, section by section, directly from the rulebook.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-4 md:px-8">
          {errorMessage && !errorMessage.startsWith("Warning:") ? (
            <p className="text-destructive text-center">{errorMessage}</p>
          ) : errorMessage && errorMessage.startsWith("Warning:") && sections.length === 0 ? (
             <p className="text-yellow-500 text-center">{errorMessage}</p>
          ) : sections.length === 0 && !errorMessage ? ( // Handles case where file was read but parsing yielded nothing
             <p className="text-muted-foreground text-center">No rulebook sections found in the main rulebook file. Ensure it uses '## Heading' for main sections.</p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sections.map((section) => (
                <AccordionItem value={section.id} key={section.id} className="border border-border/30 rounded-lg overflow-hidden bg-card/50">
                  <AccordionTrigger className="px-4 py-3 text-left text-xl hover:bg-muted/50 text-primary hover:text-primary/90">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background/30">
                    {section.contentNodes.length > 0 ? section.contentNodes.map(renderSectionNode) : <p className="italic text-muted-foreground">_This section from the rulebook appears to have no detailed content directly under its heading._</p>}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
           {errorMessage && errorMessage.startsWith("Warning:") && sections.length > 0 && ( // Show warning even if sections were parsed
             <p className="text-yellow-500 text-center mt-4 text-sm">{errorMessage}</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
