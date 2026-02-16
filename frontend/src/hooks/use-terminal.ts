"use client";

import { useState, useCallback } from "react";
import type { TerminalCommand } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";

export function useTerminal(connId: string) {
  const [history, setHistory] = useState<TerminalCommand[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const executeCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      setLoading(true);
      setCommandHistory((prev) => [command, ...prev]);
      setHistoryIndex(-1);

      try {
        const result = await api.executeCommand(connId, command);
        setHistory((prev) => [...prev, result]);
      } catch (error) {
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            command,
            output: `Error: ${getErrorMessage(error)}`,
            timestamp: new Date().toISOString(),
            success: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [connId],
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (commandHistory.length === 0) return "";

      let newIndex: number;
      if (direction === "up") {
        newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      } else {
        newIndex = Math.max(historyIndex - 1, -1);
      }

      setHistoryIndex(newIndex);
      return newIndex === -1 ? "" : commandHistory[newIndex];
    },
    [commandHistory, historyIndex],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    loading,
    executeCommand,
    navigateHistory,
    clearHistory,
  };
}
