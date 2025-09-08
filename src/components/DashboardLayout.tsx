"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";

interface DashboardLayoutProps {
  userEmail?: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({
  userEmail,
  children,
  title = "Dashboard",
  description,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop

  return (
    <div className="h-screen w-full flex overflow-hidden bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      {mobileOpen && (
        <Sidebar
          userEmail={userEmail}
          mobile
          onClose={() => setMobileOpen(false)}
        />
      )}
      {sidebarOpen && (
        <Sidebar userEmail={userEmail} onOpenChange={setSidebarOpen} />
      )}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex items-center gap-4 px-4 lg:px-6 h-16 border-b border-indigo-100/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/60">
          {/* Mobile open button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-indigo-600 hover:bg-indigo-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Open navigation"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {/* Desktop show button when sidebar hidden */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:inline-flex items-center justify-center rounded-md p-2 text-indigo-600 hover:bg-indigo-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Show sidebar"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
          </div>
          <div className="ml-auto hidden sm:block text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            {userEmail ?? "unknown"}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-gradient-to-b from-white/60 to-white/20 dark:from-neutral-900/60 dark:to-neutral-900/20">
          {children}
        </main>
      </div>
    </div>
  );
}
