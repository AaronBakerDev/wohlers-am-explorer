"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from "lucide-react";
import { downloadBlob, formatTimestamp, sanitizeFilename } from "@/lib/export";

type ChartExportButtonProps = {
  targetRef: RefObject<HTMLElement | null>;
  filenameBase: string;
  size?: "sm" | "default";
  disabled?: boolean;
  align?: "start" | "end"; // reserved for future dropdown alignment
  label?: string;
};

export function ChartExportButton({
  targetRef,
  filenameBase,
  size = "sm",
  disabled,
  label = "Export PNG",
}: ChartExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!targetRef.current) return;
    try {
      setSuccess(false);
      setExporting(true);

      // Dynamically import to ensure client-side usage only.
      const html2canvas = (
        await import("html2canvas")
      ).default;

      const node = targetRef.current as HTMLElement;

      // Resolve a solid background color to avoid transparent PNGs in dark mode
      const computedBg = getComputedStyle(node).backgroundColor ||
        getComputedStyle(document.documentElement).getPropertyValue("--card") ||
        getComputedStyle(document.documentElement).getPropertyValue("--background") ||
        "#ffffff";

      const canvas = await html2canvas(node, {
        backgroundColor: computedBg.trim() || undefined,
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
        useCORS: true,
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("Failed to create PNG blob");

      const filename = `${sanitizeFilename(filenameBase)}_${formatTimestamp().slice(0, 10)}.png`;
      downloadBlob(blob, filename);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1800);
    } catch (err) {
      console.error("Chart export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const isDisabled = disabled || exporting || !targetRef.current;

  return (
    <Button size={size} variant="outline" onClick={handleExport} disabled={isDisabled} aria-busy={exporting}>
      {exporting ? (
        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
      ) : success ? (
        <Check className="h-3 w-3 mr-2" />
      ) : (
        <Download className="h-3 w-3 mr-2" />
      )}
      {label}
    </Button>
  );
}
