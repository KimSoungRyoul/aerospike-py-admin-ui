"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

export function useKeyboardShortcuts() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            toggleSidebar();
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
}
