/**
 * Confetti Animation Component
 *
 * Shows a celebratory confetti burst when achievements are unlocked.
 */

import { useEffect, useState, useCallback } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = [
  "#f43f5e",
  "#ec4899",
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
];

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({
  active,
  onComplete,
}: ConfettiProps): JSX.Element | null {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const generatePieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
      });
    }
    return newPieces;
  }, []);

  useEffect(() => {
    if (active) {
      setPieces(generatePieces());

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, generatePieces, onComplete]);

  if (!active && pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Simple confetti burst from a point
export function ConfettiBurst({
  x,
  y,
  active,
}: {
  x: number;
  y: number;
  active: boolean;
}): JSX.Element | null {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        newPieces.push({
          id: i,
          x: x,
          y: y,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: 0,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [active, x, y]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        return (
          <div
            key={piece.id}
            className="absolute w-2 h-2"
            style={{
              left: `${piece.x}px`,
              top: `${piece.y}px`,
              backgroundColor: piece.color,
              borderRadius: "50%",
              animation: `burst-${i % 8} 1s ease-out forwards`,
            }}
          />
        );
      })}
      <style>{`
        ${Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const distance = 100 + Math.random() * 50;
          return `
            @keyframes burst-${i} {
              0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 50}px) scale(0);
                opacity: 0;
              }
            }
          `;
        }).join("\n")}
      `}</style>
    </div>
  );
}
