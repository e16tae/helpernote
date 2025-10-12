import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className={`${sizeClasses[size]} w-auto text-primary`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="10" width="32" height="20" rx="4" fill="currentColor" opacity="0.1"/>
        <path d="M10 16h20M10 20h14M10 24h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="14" r="4" fill="currentColor"/>
      </svg>
      <span className={`font-bold text-foreground ${size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl'}`}>
        Helpernote
      </span>
    </div>
  );
}
