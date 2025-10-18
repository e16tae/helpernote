"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/page-transition";
import { ErrorBoundary } from "@/components/error-boundary";
import { SkipToContent } from "@/components/ui/skip-to-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <SkipToContent />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto bg-background p-6" tabIndex={-1}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
