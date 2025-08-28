"use client";

import type { FilterState } from "@/lib/filters/types";
import * as XLSX from "xlsx";

export type ExportFormat = "csv" | "xlsx";

export type ColumnDef<T> = {
  key: keyof T | string;
  header: string;
  map?: (row: T) => string | number | null | undefined;
};

export function formatTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + "_" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
}

export function buildFilterContextSuffix(filters?: FilterState, extras?: Record<string, string | number | undefined>): string {
  if (!filters && !extras) return "";
  const parts: string[] = [];
  if (filters) {
    const add = (label: string, count: number) => {
      if (count > 0) parts.push(`${label}-${count}`);
    };
    add("tech", filters.technologyIds.length);
    add("mat", filters.materialIds.length);
    add("proc", filters.processCategories.length);
    add("size", filters.sizeRanges.length);
    add("ctry", filters.countries.length);
    add("state", filters.states.length);
  }
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v !== undefined && v !== "") parts.push(`${k}-${v}`);
    }
  }
  return parts.length ? `_filters_${parts.join("_")}` : "";
}

export function buildFilename(base: string, format: ExportFormat, filters?: FilterState, extras?: Record<string, string | number | undefined>) {
  const ts = formatTimestamp();
  const suffix = buildFilterContextSuffix(filters, extras);
  return `${sanitizeFilename(base)}_${ts}${suffix}.${format === "csv" ? "csv" : "xlsx"}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function toCSV<T>(rows: T[], columns: ColumnDef<T>[]): string {
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const headers = columns.map((c) => c.header).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const value = c.map ? c.map(row) : (row as Record<string, unknown>)[c.key as string];
          return escape(value);
        })
        .join(","),
    )
    .join("\n");
  return headers + "\n" + body;
}

export function toXLSXBlob<T>(rows: T[], columns: ColumnDef<T>[]): Blob {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of columns) {
      obj[col.header] = col.map ? col.map(row) : (row as Record<string, unknown>)[col.key as string] ?? "";
    }
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.header) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");
  const ab = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([ab], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

