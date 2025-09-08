"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userEmail?: string;
  onClose?: () => void; // for mobile overlay backdrop
  mobile?: boolean;
  onOpenChange?: (open: boolean) => void; // controlled from layout (desktop)
}

const navItems = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Activities", href: "/activities", icon: ActivitiesIcon },
];

export function Sidebar({
  userEmail,
  onClose,
  mobile = false,
  onOpenChange,
}: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div
      className={cn(
        "h-full flex flex-col select-none w-64",
        "bg-gradient-to-b from-indigo-50/80 via-white/70 to-white/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900",
        "backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/60 border-r border-indigo-100/60 dark:border-neutral-800 relative"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-indigo-100/70 dark:border-neutral-800">
        <button
          onClick={() => onOpenChange?.(false)}
          aria-label="Hide sidebar"
          className="rounded-md p-2 text-indigo-600 hover:bg-indigo-100/70 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="font-semibold tracking-tight text-sm sm:text-base">
          Education Platform
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-indigo-100/70 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  active
                    ? "text-white"
                    : "text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pb-4 pt-3">
        <div className="rounded-md border border-indigo-100/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-800/70 backdrop-blur p-3 flex flex-col gap-2 text-xs">
          {userEmail && (
            <div className="space-y-1">
              <p className="font-semibold text-neutral-700 dark:text-neutral-200 text-xs uppercase tracking-wide">
                Account
              </p>
              <p
                className="truncate font-mono text-[11px] text-neutral-500 dark:text-neutral-400"
                title={userEmail}
              >
                {userEmail}
              </p>
            </div>
          )}
          <form action="/auth/signout" method="post" className="w-full">
            <button
              type="submit"
              className={cn(
                "group flex items-center gap-2 rounded-md w-full text-[11px] font-medium tracking-wide uppercase",
                "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow hover:from-rose-600 hover:to-pink-600",
                "px-3 py-2 transition-all active:scale-[.98]"
              )}
            >
              <LogoutIcon className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </form>
          <p className="text-[10px] leading-tight text-neutral-400 dark:text-neutral-500 pt-1">
            Secure admin dashboard interface
          </p>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div
        className="fixed inset-0 z-40 flex lg:hidden"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-64 max-w-[80%] h-full shadow-xl animate-in slide-in-from-left bg-white dark:bg-neutral-900">
          {content}
          <button
            aria-label="Close sidebar"
            onClick={onClose}
            className="absolute -right-10 top-4 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 shadow"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }
  return (
    <aside
      className={cn(
        "h-full w-64 hidden lg:block animate-in fade-in slide-in-from-left"
      )}
    >
      {content}
    </aside>
  );
}

// Icons
function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ActivitiesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h16v4H4z" />
      <path d="M4 12h16v8H4z" />
      <path d="M9 8v4" />
    </svg>
  );
}
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
