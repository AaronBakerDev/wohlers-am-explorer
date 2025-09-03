"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2, Check } from "lucide-react";
import type { ColumnDef, ExportFormat } from "@/lib/export";
import { toCSV, toXLSXBlob, downloadBlob, buildFilename } from "@/lib/export";
import type { FilterState } from "@/lib/filters/types";

type ExportButtonProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  filenameBase: string;
  filters?: FilterState;
  extras?: Record<string, string | number | undefined>;
  disabled?: boolean;
  selectedOnlyIds?: string[]; // when provided, export only these IDs
  idKey?: keyof T | string; // defaults to 'id'
  size?: "sm" | "default";
  align?: "start" | "end";
};

export default function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filenameBase,
  filters,
  extras,
  disabled,
  selectedOnlyIds,
  idKey = "id",
  size = "sm",
  align = "end",
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [success, setSuccess] = useState<ExportFormat | null>(null);

  const effectiveData = useMemo(() => {
    if (selectedOnlyIds && selectedOnlyIds.length > 0) {
      const key = idKey as string;
      return data.filter((row) => selectedOnlyIds.includes(String((row as Record<string, unknown>)[key])));
    }
    return data;
  }, [data, selectedOnlyIds, idKey]);

  const doExport = async (format: ExportFormat) => {
    try {
      setSuccess(null);
      setExporting(format);
      const filename = buildFilename(filenameBase, format, filters, {
        ...(extras || {}),
        selected: selectedOnlyIds && selectedOnlyIds.length > 0 ? selectedOnlyIds.length : undefined,
        rows: effectiveData.length,
      });

      if (format === "csv") {
        const csv = toCSV(effectiveData, columns);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, filename);
      } else {
        const blob = toXLSXBlob(effectiveData, columns);
        downloadBlob(blob, filename);
      }
      setSuccess(format);
      // Clear success after short delay
      setTimeout(() => setSuccess(null), 1800);
    } catch (e) {
      console.error("Export error", e);
    } finally {
      setExporting(null);
    }
  };

  const count = effectiveData.length;
  const isDisabled = disabled || count === 0 || Boolean(exporting);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size={size} disabled={isDisabled} aria-busy={!!exporting}>
          {exporting ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : success ? (
            <Check className="h-3 w-3 mr-2" />
          ) : (
            <Download className="h-3 w-3 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <button
          className="flex w-full items-center text-left px-2 py-1.5 text-sm hover:bg-muted/50"
          onClick={() => doExport("csv")}
          disabled={!!exporting}
        >
          <FileText className="h-3 w-3 mr-2" /> CSV (.csv)
        </button>
        <button
          className="flex w-full items-center text-left px-2 py-1.5 text-sm hover:bg-muted/50"
          onClick={() => doExport("xlsx")}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-3 w-3 mr-2" /> Excel (.xlsx)
        </button>
        <DropdownMenuSeparator />
        {selectedOnlyIds && selectedOnlyIds.length > 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {selectedOnlyIds.length} selected rows
          </div>
        ) : (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">All filtered rows</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
