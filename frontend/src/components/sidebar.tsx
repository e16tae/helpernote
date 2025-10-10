'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserSearch,
  Link2,
  DollarSign,
  Settings,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '고객 관리', href: '/dashboard/customers', icon: Users },
  { name: '구인 공고', href: '/dashboard/job-postings', icon: Briefcase },
  { name: '구직 공고', href: '/dashboard/job-seekers', icon: UserSearch },
  { name: '매칭 관리', href: '/dashboard/matchings', icon: Link2 },
  { name: '정산 관리', href: '/dashboard/settlements', icon: DollarSign },
  { name: '태그 관리', href: '/dashboard/tags', icon: Tag },
  { name: '계정 설정', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-sidebar border-r transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-center px-4 py-4">
        {collapsed ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-500 shadow-md">
            <Briefcase className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        ) : (
          <Logo href="/dashboard" className="scale-90" />
        )}
      </div>
      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
            >
              {/* Active indicator - left border */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-colors flex-shrink-0",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Toggle Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? 'justify-center px-2' : 'justify-start'
          )}
          onClick={toggleCollapsed}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              사이드바 접기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
