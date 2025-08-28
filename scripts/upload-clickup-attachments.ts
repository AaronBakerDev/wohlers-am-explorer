/**
 * Script: upload-clickup-attachments.ts
 * Purpose: Upload screenshots (e.g., from Playwright) as attachments to a ClickUp task.
 *
 * Usage:
 *   # Set your ClickUp API key (token starts with pk_)
 *   export CLICKUP_API_KEY="pk_XXXXXXXX..."
 *
 *   # Upload all images in e2e-artifacts to the task
 *   npx ts-node scripts/upload-clickup-attachments.ts <CLICKUP_TASK_ID> [DIR=e2e-artifacts] [--note="Uploaded screenshots"]
 *
 *   # Options
 *     --pattern="*.png"       Limit uploads to matching files (basic suffix match if not a glob)
 *     --dry-run               Print actions without uploading
 *     --recursive             Recurse into subdirectories
 *     --note="text"           Adds a comment to the task after uploads
 *
 * Examples:
 *   npx ts-node scripts/upload-clickup-attachments.ts 86c4zen4j
 *   npx ts-node scripts/upload-clickup-attachments.ts 86c4zen4j e2e-artifacts --pattern="*.png" --note="Playwright screenshots"
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

// Node 18+ provides global fetch, FormData, Blob via undici
const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY || process.env.CLICKUP_TOKEN;
const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

type CliOptions = {
  taskId: string;
  dir: string;
  pattern?: string;
  dryRun?: boolean;
  recursive?: boolean;
  note?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const opts: CliOptions = {
    taskId: "",
    dir: "e2e-artifacts",
    pattern: undefined,
    dryRun: false,
    recursive: false,
    note: undefined,
  };

  if (args.length === 0) {
    printUsageAndExit("Missing required <CLICKUP_TASK_ID>.");
  }

  // Positional: taskId
  opts.taskId = args[0];

  // Optional positional: dir
  if (args[1] && !args[1].startsWith("--")) {
    opts.dir = args[1];
  }

  // Flags
  for (const arg of args.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, rawValue] = arg.split("=", 2);
    const value = rawValue ?? "";

    if (key === "--pattern") {
      opts.pattern = value || undefined;
    } else if (key === "--dry-run") {
      opts.dryRun = true;
    } else if (key === "--recursive") {
      opts.recursive = true;
    } else if (key === "--note") {
      opts.note = value || "";
    }
  }

  return opts;
}

function printUsageAndExit(msg?: string): never {
  if (msg) console.error(`Error: ${msg}`);
  console.error(`
Usage:
  CLICKUP_API_KEY=pk_xxx npx ts-node scripts/upload-clickup-attachments.ts <CLICKUP_TASK_ID> [DIR=e2e-artifacts] [--pattern="*.png"] [--dry-run] [--recursive] [--note="text"]

Examples:
  npx ts-node scripts/upload-clickup-attachments.ts 86c4zen4j
  npx ts-node scripts/upload-clickup-attachments.ts 86c4zen4j e2e-artifacts --pattern="*.png" --note="Playwright screenshots"
`);
  process.exit(1);
}

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext);
}

function matchPattern(filePath: string, pattern?: string): boolean {
  if (!pattern) return true;
  // Very lightweight matcher: supports suffix patterns like "*.png"
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // ".png"
    return filePath.toLowerCase().endsWith(suffix.toLowerCase());
  }
  // If full string provided, do a simple includes
  return filePath.toLowerCase().includes(pattern.toLowerCase());
}

async function listFiles(dir: string, recursive: boolean): Promise<string[]> {
  const results: string[] = [];
  async function walk(current: string) {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          await walk(full);
        }
      } else {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

async function uploadAttachment(taskId: string, filePath: string) {
  if (!CLICKUP_API_KEY) {
    throw new Error("CLICKUP_API_KEY env var not set.");
  }
  const url = `${CLICKUP_API_BASE}/task/${encodeURIComponent(taskId)}/attachment`;

  const buffer = await fsp.readFile(filePath);
  const blob = new Blob([new Uint8Array(buffer)]);
  const form = new FormData();
  // ClickUp expects the file under "attachment"
  form.append("attachment", blob, path.basename(filePath));

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: CLICKUP_API_KEY,
      // Do not set Content-Type; letting fetch set boundary automatically
    } as any,
    body: form as any,
  });

  if (!resp.ok) {
    const text = await safeText(resp);
    throw new Error(`Upload failed for ${filePath}: ${resp.status} ${resp.statusText} - ${text}`);
  }
  return await resp.json();
}

async function addTaskComment(taskId: string, text: string) {
  if (!CLICKUP_API_KEY) {
    throw new Error("CLICKUP_API_KEY env var not set.");
  }
  const url = `${CLICKUP_API_BASE}/task/${encodeURIComponent(taskId)}/comment`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: CLICKUP_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment_text: text }),
  });
  if (!resp.ok) {
    const msg = await safeText(resp);
    throw new Error(`Failed to add comment: ${resp.status} ${resp.statusText} - ${msg}`);
  }
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "<no-body>";
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.taskId) {
    printUsageAndExit("Task ID is required.");
  }
  if (!CLICKUP_API_KEY) {
    printUsageAndExit("CLICKUP_API_KEY env var must be set.");
  }

  const dirPath = path.resolve(process.cwd(), opts.dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    printUsageAndExit(`Directory not found: ${dirPath}`);
  }

  const files = (await listFiles(dirPath, !!opts.recursive))
    .filter((f) => isImageFile(f))
    .filter((f) => matchPattern(f, opts.pattern));

  if (files.length === 0) {
    console.log(`No matching image files found in ${dirPath}${opts.pattern ? ` with pattern ${opts.pattern}` : ""}.`);
    process.exit(0);
  }

  console.log(`Preparing to upload ${files.length} file(s) to ClickUp task ${opts.taskId} from ${dirPath}`);
  if (opts.dryRun) {
    for (const f of files) {
      console.log(`[dry-run] Would upload: ${f}`);
    }
    if (opts.note) {
      console.log(`[dry-run] Would add comment: ${opts.note}`);
    }
    process.exit(0);
  }

  let success = 0;
  let failed = 0;

  for (const f of files) {
    const rel = path.relative(process.cwd(), f);
    try {
      await uploadAttachment(opts.taskId, f);
      console.log(`✓ Uploaded: ${rel}`);
      success++;
    } catch (err: any) {
      console.error(`✗ Failed: ${rel} - ${err?.message || String(err)}`);
      failed++;
    }
  }

  if (opts.note) {
    try {
      await addTaskComment(opts.taskId, opts.note);
      console.log("✓ Added comment to task.");
    } catch (err: any) {
      console.error(`✗ Failed to add comment: ${err?.message || String(err)}`);
    }
  }

  console.log(`Done. Uploaded: ${success}, Failed: ${failed}`);
  process.exit(failed > 0 ? 2 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err?.message || err);
  process.exit(1);
});
