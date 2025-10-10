import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

interface SiteHeaderProps {
  showNavigation?: boolean;
}

export function SiteHeader({ showNavigation = true }: SiteHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo width={160} height={36} />
        {showNavigation && (
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              홈
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
