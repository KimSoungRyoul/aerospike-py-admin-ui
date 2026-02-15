"use client";

import Link from "next/link";
import { Moon, Sun, Monitor, PanelLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore, type Theme } from "@/stores/ui-store";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Header() {
  const { theme, setTheme, toggleSidebar, setMobileNavOpen, mobileNavOpen } = useUIStore();
  const { isDesktop } = useBreakpoint();

  const handleToggle = () => {
    if (isDesktop) {
      toggleSidebar();
    } else {
      setMobileNavOpen(!mobileNavOpen);
    }
  };

  return (
    <header className="bg-card/80 relative z-50 flex h-12 items-center justify-between border-b px-4 backdrop-blur-sm">
      {/* Bottom gradient accent line */}
      <div className="via-accent/40 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="text-muted-foreground hover:text-foreground h-10 w-10 md:h-8 md:w-8"
            >
              {isDesktop ? <PanelLeft className="h-4 w-4" /> : <Menu className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle Sidebar (Cmd+B)</TooltipContent>
        </Tooltip>

        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="from-primary to-primary/80 relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm">
            <span className="text-primary-foreground text-[10px] font-bold tracking-wider">AS</span>
            <div className="absolute inset-0 rounded-lg ring-1 ring-white/10 ring-inset" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm leading-none font-semibold tracking-tight">Aerospike</span>
            <span className="text-muted-foreground mt-0.5 hidden text-[10px] leading-none font-medium tracking-wide uppercase sm:block">
              UI Manager
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-10 w-10 md:h-8 md:w-8"
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {(["light", "dark", "system"] as Theme[]).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="gap-2 capitalize">
                {t === "light" && <Sun className="h-4 w-4 text-amber-500" />}
                {t === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
                {t === "system" && <Monitor className="text-muted-foreground h-4 w-4" />}
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
