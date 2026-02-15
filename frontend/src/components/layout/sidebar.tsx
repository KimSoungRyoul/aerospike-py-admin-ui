"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MoreHorizontal,
  Plus,
  Search,
  Server,
  Table2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useUIStore } from "@/stores/ui-store";
import type { ConnectionWithStatus } from "@/lib/api/types";

interface ConnectionItemProps {
  connection: ConnectionWithStatus;
}

const ConnectionItem = React.memo(function ConnectionItem({ connection }: ConnectionItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const selectConnection = useConnectionStore((s) => s.selectConnection);

  const isActive = pathname?.includes(`/${connection.id}`);

  const handleClick = () => {
    selectConnection(connection.id);
    router.push(`/browser/${connection.id}`);
  };

  const handleNav = (path: string) => {
    selectConnection(connection.id);
    router.push(`/${path}/${connection.id}`);
  };

  return (
    <div className="group flex items-center gap-0.5">
      <button
        onClick={handleClick}
        className={cn(
          "flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 min-w-0",
          isActive
            ? "bg-accent/10 text-accent"
            : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )}
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-sidebar transition-shadow",
            connection.status.connected
              ? "ring-emerald-500/30 status-glow-green"
              : "ring-red-500/30 status-glow-red"
          )}
          style={{ backgroundColor: connection.color }}
        />
        <span className="truncate font-medium">
          {connection.name}
        </span>
        <span
          className={cn(
            "ml-auto h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
            connection.status.connected ? "bg-emerald-500" : "bg-red-500"
          )}
        />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleNav("browser")}>
            <Table2 className="mr-2 h-4 w-4" /> Browser
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNav("cluster")}>
            <Server className="mr-2 h-4 w-4" /> Cluster
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

export function Sidebar() {
  const { connections, fetchConnections } = useConnectionStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-1">
          {filteredConnections.length === 0 && search && (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              No connections found
            </p>
          )}
          {filteredConnections.map((conn) => (
            <ConnectionItem
              key={conn.id}
              connection={conn}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="p-2.5 space-y-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs border-dashed border-sidebar-border hover:border-accent/50 hover:bg-accent/5 hover:text-accent transition-colors"
          onClick={() => router.push("/")}
        >
          <Plus className="h-3.5 w-3.5" />
          New Connection
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
