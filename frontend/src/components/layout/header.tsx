"use client";

import Link from "next/link";
import { Moon, Sun, Monitor, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore, type Theme } from "@/stores/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Header() {
  const { theme, setTheme, toggleSidebar } = useUIStore();

  return (
    <header className="relative z-50 flex h-12 items-center justify-between border-b px-4 bg-card/80 backdrop-blur-sm">
      {/* Bottom gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle Sidebar (Cmd+B)</TooltipContent>
        </Tooltip>

        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <span className="text-[10px] font-bold tracking-wider text-primary-foreground">AS</span>
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight leading-none">Aerospike</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase leading-none mt-0.5">UI Manager</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t)}
                className="capitalize gap-2"
              >
                {t === "light" && <Sun className="h-4 w-4 text-amber-500" />}
                {t === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
                {t === "system" && <Monitor className="h-4 w-4 text-muted-foreground" />}
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
