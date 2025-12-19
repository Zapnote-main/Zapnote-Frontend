'use client';

import { ReactNode } from 'react';

interface BackgroundProps {
  children?: ReactNode;
}

function DarkBackground() {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          'radial-gradient(125% 125% at 50% 100%, #000000 40%, #350136 100%)',
      }}
      suppressHydrationWarning
    />
  );
}

function LightBackground() {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 70% 20%, rgba(175, 109, 255, 0.85), transparent 68%),
          radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.75), transparent 68%),
          radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.98), transparent 68%),
          radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.3), transparent 68%),
          linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
        `,
      }}
      suppressHydrationWarning
    />
  );
}


export default function Background({ children }: BackgroundProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="hidden dark:block">
        <DarkBackground />
      </div>
      <div className="block dark:hidden">
        <LightBackground />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
