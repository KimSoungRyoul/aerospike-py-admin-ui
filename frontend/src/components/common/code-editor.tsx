"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui-store";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full min-h-[200px]" />,
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string | number;
  theme?: string;
}

function useResolvedTheme(): "vs" | "vs-dark" {
  const theme = useUIStore((s) => s.theme);
  if (theme === "dark") return "vs-dark";
  if (theme === "light") return "vs";
  // system: check media query
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs";
  }
  return "vs-dark";
}

export function CodeEditor({
  value,
  onChange,
  language = "json",
  readOnly = false,
  height = "300px",
  theme,
}: CodeEditorProps) {
  const resolvedTheme = useResolvedTheme();

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      theme={theme ?? resolvedTheme}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 8 },
      }}
    />
  );
}
