import Link from 'next/link';
import { Briefcase } from 'lucide-react';

interface LogoProps {
  width?: number;
  height?: number;
  href?: string;
  className?: string;
}

export function Logo({
  width = 160,
  height = 36,
  href = "/",
  className = ""
}: LogoProps) {
  const logoElement = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-500 shadow-md">
        <Briefcase className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
          Helpernote
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center transition-opacity hover:opacity-80">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
