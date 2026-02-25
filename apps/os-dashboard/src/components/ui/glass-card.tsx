/**
 * glass-card.tsx
 *
 * 3D Glassmorphism Card Component System
 * - Glass3DCard: Light glass card with 3D effects
 * - DarkGlass3DCard: Dark glass card variant
 * - Icon3D: 3D icon container
 * - Badge3D: 3D badge component
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ===== Glass 3D Card =====
interface Glass3DCardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

export const Glass3DCard: React.FC<Glass3DCardProps> = ({
  children,
  className,
  dark = false,
  style,
  id,
}) => {
  return (
    <div id={id} className="perspective-1200">
      <div
        className={cn(
          'rounded-3xl p-[1.5px] h-full',
          dark ? 'shadow-3d-dark' : 'shadow-3d'
        )}
        style={{
          background: dark
            ? 'linear-gradient(145deg, rgba(75,75,85,0.92) 0%, rgba(40,40,50,0.85) 50%, rgba(60,60,70,0.92) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
        }}
      >
        <div
          className={cn(
            'rounded-[23px] h-full relative overflow-hidden',
            className
          )}
          style={{
            background: dark
              ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
              : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.85) 20%, rgba(255,255,255,0.92) 40%, rgba(251,251,254,0.8) 60%, rgba(255,255,255,0.94) 80%, rgba(254,254,255,0.88) 100%)',
            backdropFilter: 'blur(80px) saturate(200%)',
            WebkitBackdropFilter: 'blur(80px) saturate(200%)',
            ...style,
          }}
        >
          {/* Chrome top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: dark
                ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 80%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
            }}
          />

          {/* Chrome left edge */}
          <div
            className="absolute top-px left-0 w-px pointer-events-none"
            style={{
              bottom: '25%',
              background: dark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 60%, transparent 100%)',
            }}
          />

          {/* Surface reflection */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: '55%',
              background: dark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 35%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.1) 55%, transparent 100%)',
              borderRadius: '23px 23px 50% 50%',
            }}
          />

          {/* Bottom shadow */}
          <div
            className="absolute bottom-0 pointer-events-none rounded-b-[23px]"
            style={{
              left: '8%',
              right: '8%',
              height: '25%',
              background: dark
                ? 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 100%)'
                : 'linear-gradient(0deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ===== 3D Icon Container =====
interface Icon3DProps {
  children: React.ReactNode;
  size?: number;
  dark?: boolean;
  className?: string;
}

export const Icon3D: React.FC<Icon3DProps> = ({
  children,
  size = 48,
  dark = false,
  className,
}) => {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: dark
          ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
        borderRadius: size * 0.32,
        border: dark
          ? '1px solid rgba(255,255,255,0.12)'
          : '1px solid rgba(255,255,255,0.95)',
        boxShadow: dark
          ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Highlight */}
      {!dark && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '3px',
            left: '12%',
            right: '12%',
            height: '38%',
            background:
              'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: `${size * 0.22}px ${size * 0.22}px 50% 50%`,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  );
};

// ===== 3D Badge =====
interface Badge3DProps {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export const Badge3D: React.FC<Badge3DProps> = ({
  children,
  dark = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg relative overflow-hidden',
        className
      )}
      style={{
        background: dark
          ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
        border: dark
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(255,255,255,0.95)',
        boxShadow: dark
          ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.02)',
      }}
    >
      {/* Highlight */}
      {!dark && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none rounded-t-lg"
          style={{
            height: '50%',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)',
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  );
};

// ===== 3D Text Style Objects (for inline use) =====
export const text3DStyles = {
  heroNumber: {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    background:
      'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.1))',
  } as React.CSSProperties,

  number: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#0a0a0c',
    textShadow:
      '0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,

  heading: {
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#18181b',
    textShadow:
      '0 1px 1px rgba(255,255,255,0.85), 0 -1px 1px rgba(0,0,0,0.03)',
  } as React.CSSProperties,

  label: {
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    fontSize: '10px',
    background:
      'linear-gradient(180deg, #8a8a8f 0%, #9a9a9f 50%, #7a7a7f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,

  body: {
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: '#515158',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,

  // Dark variants
  darkNumber: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    background:
      'linear-gradient(180deg, #ffffff 0%, #d8d8dd 35%, #ffffff 70%, #e5e5ea 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
  } as React.CSSProperties,

  darkLabel: {
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  } as React.CSSProperties,

  darkBody: {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
};

export default Glass3DCard;
