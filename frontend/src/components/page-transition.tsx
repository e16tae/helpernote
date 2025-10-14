"use client";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  // 빠릿한 화면 전환을 위해 별도의 페이드 애니메이션을 적용하지 않습니다.
  return <>{children}</>;
}
