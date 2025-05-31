
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpenText } from "lucide-react";
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'How to Play - Riddle of the Beast Companion',
  description: 'Learn the rules of the Riddle of the Beast board game.',
};

// Basic Markdown to React elements parser
const parseMarkdownToReactElements = (markdown: string): React.ReactNode[] => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let keyIndex = 0;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paragraphText = currentParagraphLines.join('\n').trim();
      if (paragraphText) {
        // Replace **text** with <strong>text</strong> for basic bold
        // Replace *text* or _text_ with <em>text</em> for basic italic (less greedy for *)
        const htmlText = paragraphText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>') // For *italic* but not **bold**
          .replace(/__(.*?)__/g, '<strong>$1</strong>') // For __bold__
          .replace(/_(.*?)_/g, '<em>$1</em>'); // For _italic_
          
        elements.push(
          <p 
            key={`p-${keyIndex++}`} 
            className="mb-3 leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: htmlText }}
          />
        );
      }
      currentParagraphLines = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('###### ')) {
      flushParagraph();
      elements.push(<h6 key={`h6-${keyIndex++}`} className="text-lg font-semibold mt-3 mb-1 text-primary/90">{line.substring(7)}</h6>);
    } else if (line.startsWith('##### ')) {
      flushParagraph();
      elements.push(<h5 key={`h5-${keyIndex++}`} className="text-xl font-semibold mt-4 mb-1 text-primary/90">{line.substring(6)}</h5>);
    } else if (line.startsWith('#### ')) {
      flushParagraph();
      elements.push(<h4 key={`h4-${keyIndex++}`} className="text-2xl font-semibold mt-4 mb-2 text-primary">{line.substring(5)}</h4>);
    } else if (line.startsWith('### ')) {
      flushParagraph();
      elements.push(<h3 key={`h3-${keyIndex++}`} className="text-3xl font-bold mt-5 mb-2 pb-1 border-b border-border text-primary">{line.substring(4)}</h3>);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      elements.push(<h2 key={`h2-${keyIndex++}`} className="text-4xl font-bold mt-6 mb-3 pb-2 border-b border-border text-primary">{line.substring(3)}</h2>);
    } else if (line.startsWith('# ')) {
      flushParagraph();
      elements.push(<h1 key={`h1-${keyIndex++}`} className="text-5xl font-extrabold mt-8 mb-4 pb-3 border-b-2 border-primary text-primary">{line.substring(2)}</h1>);
    } else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      flushParagraph();
      elements.push(<Separator key={`hr-${keyIndex++}`} className="my-6" />);
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      currentParagraphLines.push(line);
    }
  }
  flushParagraph(); // Flush any remaining paragraph content

  return elements;
};


export default async function HowToPlayPage() {
  let rulesContent = "Error loading game rules. Please check the file path and server logs.";
  let parsedElements: React.ReactNode[] = [<p key="error">{rulesContent}</p>];

  try {
    const filePath = path.join(process.cwd(), 'docs', 'game-rules.md');
    rulesContent = await fs.readFile(filePath, 'utf8');
    parsedElements = parseMarkdownToReactElements(rulesContent);
  } catch (error) {
    console.error("Failed to read game rules:", error);
    // rulesContent will remain the error message
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
            A comprehensive guide to the rules and mechanics of the game.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-4 md:px-8 space-y-4">
          {parsedElements}
        </CardContent>
      </Card>
    </div>
  );
}
