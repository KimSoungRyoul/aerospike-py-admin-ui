"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";
import { useUIStore } from "@/stores/ui-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function ThemeHandler() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");

      const listener = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useKeyboardShortcuts();

  const connIdMatch = pathname?.match(
    /\/(browser|cluster|query|indexes|admin|udfs|terminal|observability)\/([^/]+)/,
  );
  const connId = connIdMatch?.[2];
  const isConnectionPage = pathname === "/" || pathname === "/settings";

  return (
    <TooltipProvider delayDuration={150}>
      <ThemeHandler />
      <div className="bg-background flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            {connId && !isConnectionPage && <TabBar connId={connId} />}
            <main className="dot-pattern flex-1 overflow-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
