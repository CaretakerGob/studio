
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { GameCard } from './card-generator-ui';
import { cn } from '@/lib/utils';

interface GameCardDisplayProps {
  card: GameCard | null;
  isLoading?: boolean;
  cardKey?: number | string;
  size?: 'large' | 'medium' | 'small';
  className?: string;
  onClick?: () => void;
  isButton?: boolean;
  buttonText?: string;
  imageOnly?: boolean; // New prop
}

export function GameCardDisplay({
  card,
  isLoading = false,
  cardKey,
  size = 'large',
  className,
  onClick,
  isButton = false,
  buttonText,
  imageOnly = false, // Default to false
}: GameCardDisplayProps) {
  if (isLoading) {
    const aspectClass = 'aspect-[5/7]';
    if (size === 'large') {
      return (
        <div className={cn("space-y-4 w-full max-w-xs", className)}>
          <Skeleton className={cn("h-auto w-full rounded-lg mx-auto", aspectClass)} />
          {!imageOnly && (
            <>
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </>
          )}
        </div>
      );
    }
    return ( 
      <Card className={cn("bg-card/60 border-muted-foreground/30 shadow-sm overflow-hidden", aspectClass, className)}>
        <Skeleton className={cn("h-full w-full rounded-t-md", aspectClass)} />
      </Card>
    );
  }

  if (!card) {
    return null; 
  }

  const cardBaseClass = "bg-card/80 border-primary shadow-lg";
  const cardSizeClass = 
    size === 'large' ? "w-full max-w-[300px] sm:max-w-sm md:max-w-md" :
    size === 'medium' ? "w-full max-w-[200px]" :
    "w-full max-w-[150px]";

  const imageWrapperClass = 
    size === 'large' ? "relative w-full aspect-[5/7] overflow-hidden rounded-t-lg" :
    "relative w-full aspect-[5/7] overflow-hidden rounded-md"; // Keep rounded for image-only cards
  
  const imageSizes = 
    size === 'large' ? "(max-width: 640px) 90vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 300px" :
    size === 'medium' ? "200px" :
    "150px";

  const titleClass = 
    size === 'large' ? "text-xl text-primary" :
    size === 'medium' ? "text-base text-primary truncate group-hover:underline" :
    "text-sm text-primary truncate";
  
  const descriptionClass = size === 'large' ? "text-sm" : "text-xs";
  const contentTextClass = size === 'large' ? "text-muted-foreground" : "text-xs text-muted-foreground truncate";

  const cardProps = isButton ? {
    role: "button",
    tabIndex: 0,
    onClick: onClick,
    onKeyPress: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }
  } : {};

  return (
    <Card
      key={cardKey}
      className={cn(
        cardBaseClass,
        cardSizeClass,
        size !== 'large' && "bg-card/60 border-muted-foreground/30 shadow-sm",
        isButton && "hover:shadow-primary/40 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer group",
        imageOnly && "p-0 border-0 bg-transparent shadow-none", // Remove padding/border/bg for image-only
        className
      )}
      {...cardProps}
    >
      {card.imageUrl && (
        <div className={cn(imageWrapperClass, imageOnly && "rounded-md")}> {/* Ensure rounding for image-only */}
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            sizes={imageSizes}
            style={{ objectFit: "contain" }}
            data-ai-hint={card.dataAiHint}
            priority={size === 'large'}
          />
        </div>
      )}
      {!imageOnly && (
        <>
          <CardHeader className={cn("pt-4", size !== 'large' && "p-2 pb-1")}>
            <CardTitle className={titleClass}>{card.name}</CardTitle>
            <CardDescription className={descriptionClass}>
              Type: {card.type} {size === 'large' && `(From: ${card.deck})`}
            </CardDescription>
          </CardHeader>
          <CardContent className={cn(size !== 'large' && "p-2 pt-0")}>
            <p className={contentTextClass}>{card.description}</p>
            {isButton && buttonText && (
              <span className="block mt-1 text-xs text-accent group-hover:text-accent-foreground">
                {buttonText}
              </span>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
