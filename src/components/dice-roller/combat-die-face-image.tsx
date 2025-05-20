
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type CombatDieFace = 'swordandshield' | 'double-sword' | 'blank';

export interface CombatDieFaceDetails {
  imageUrl: string;
  dataAiHint: string;
  altText: string;
}

export const combatDieFaceImages: Record<CombatDieFace, CombatDieFaceDetails> = {
  swordandshield: {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fshields%20and%20sword%20188x188%20sticker.jpg?alt=media&token=7b8120cd-3495-4592-828d-9310534784f8',
    dataAiHint: 'shield sword',
    altText: 'Sword and Shield Face'
  },
  'double-sword': {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fcrossed%20swords%20188x188.jpg?alt=media&token=6e1e277e-462d-4777-af3b-e7a6e7b89789',
    dataAiHint: 'crossed swords',
    altText: 'Double Sword Face'
  },
  blank: {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/riddle-of-the-beast-companion.firebasestorage.app/o/Dice%2Fblank%20188x188%20sticker.png?alt=media&token=305ce3df-c485-43a8-8f1f-6591e104f249',
    dataAiHint: 'blank die',
    altText: 'Blank Die Face'
  },
};

interface CombatDieFaceImageProps {
  face: CombatDieFace;
  className?: string;
  size?: number;
}

export const CombatDieFaceImage: React.FC<CombatDieFaceImageProps> = ({ face, className, size = 24 }) => {
  const faceDetails = combatDieFaceImages[face];
  if (!faceDetails) return null;

  return (
    <Image
      src={faceDetails.imageUrl}
      alt={faceDetails.altText}
      width={size}
      height={size}
      data-ai-hint={faceDetails.dataAiHint}
      className={cn("inline-block", className)}
    />
  );
};
