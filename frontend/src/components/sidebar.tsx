"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserSearch,
  Link2,
  DollarSign,
  Settings,
  Menu,
  X,
  Tags,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "고객 관리",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "구인 공고",
    href: "/dashboard/job-postings",
    icon: Briefcase,
  },
  {
    title: "구직 공고",
    href: "/dashboard/job-seeking",
    icon: UserSearch,
  },
  {
    title: "매칭 관리",
    href: "/dashboard/matchings",
    icon: Link2,
  },
  {
    title: "정산 관리",
    href: "/dashboard/settlements",
    icon: DollarSign,
  },
  {
    title: "태그 관리",
    href: "/dashboard/tags",
    icon: Tags,
  },
  {
    title: "설정",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// 공통 네비게이션 메뉴 컴포넌트
function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
      {/* 데스크톱 사이드바 (lg 이상에서 표시) */}
      <div className="hidden lg:flex h-full w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex-1 p-4">
          <SidebarNav />
        </div>
      </div>
    </>
  );
}

// 모바일 햄버거 메뉴
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col bg-card">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <Logo size="sm" />
            </Link>
          </div>
          <div className="flex-1 p-4">
            <SidebarNav onItemClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
