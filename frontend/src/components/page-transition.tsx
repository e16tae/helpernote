"use client";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  // Keep transitions instant for the snappy feel requested by UX.
  return <>{children}</>;
}
