/**
 * Import vendor JSON data into Supabase (companies + equipment)
 *
 * Sources (already extracted to JSON):
 * - project-documents/04-data/extracted-vendor-data/Company_information.json
 * - project-documents/04-data/extracted-vendor-data/COMPANY___AM_systems_mfrs.json
 * - project-documents/04-data/extracted-vendor-data/COMPANY___Print_services_global.json
 *
 * Schema targets:
 * - public.companies
 *   - name (required)
 *   - website
 *   - country
 *   - state (null)
 *   - company_type: 'equipment' | 'service' | 'software' | 'material' | 'other'
 * - public.company_categories
 *   - company_id
 *   - category (e.g., 'System manufacturer', 'Printing services')
 * - public.technologies (lookup by name e.g., 'MEX','VPP','MJT','PBF-LB', etc.)
 * - public.materials (lookup by name e.g., 'Polymer','Metal','Ceramic', etc.)
 * - public.equipment
 *   - company_id
 *   - manufacturer
 *   - model
 *   - technology_id (FK to technologies)
 *   - material_id (FK to materials)
 *   - count
 *   - count_type: 'Minimum' | 'Actual' | 'Estimated'
 *
 * Usage:
 *   # Ensure environment has Supabase credentials:
 *   # Prefer service role key to bypass RLS when importing.
 *   export NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
 *   # Optionally:
 *   export DRY_RUN=1           # Only prints what would be done
 *   export BATCH_SIZE=100      # Insert batch size (default 100)
 *
 *   node scripts/import-vendor-json.js
 *
 * Notes:
 * - The script reads from `.env.local` if present to support NEXT_PUBLIC_SUPABASE_URL and keys.
 * - Country normalization is applied for consistency (e.g., "The United Kingdom" -> "United Kingdom").
 * - Duplicates are de-duplicated by company name in-memory before insert; existing DB rows are reused.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

/* ----------------------------- Configuration ----------------------------- */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 100);

const DATA_DIR = path.join(
  __dirname,
  "../../project-documents/04-data/extracted-vendor-data",
);

const FILES = {
  companyInfo: path.join(DATA_DIR, "Company_information.json"),
  systemsMfrs: path.join(DATA_DIR, "COMPANY___AM_systems_mfrs.json"),
  printServices: path.join(DATA_DIR, "COMPANY___Print_services_global.json"),
};

/* ------------------------------- Utilities ------------------------------- */

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "Missing Supabase environment variables.\n" +
        "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Set env or .env.local before running.",
    );
    process.exit(1);
  }
}

function readJsonSafe(filePath, fallback = []) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`WARN: Unable to read/parse ${filePath}: ${e.message}`);
    return fallback;
  }
}

function normString(s) {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

function normalizeCountry(country) {
  const c = normString(country);
  if (!c) return null;
  const map = new Map(
    [
      ["The United Kingdom", "United Kingdom"],
      ["United Kingdom", "United Kingdom"],
      ["U.K.", "United Kingdom"],
      ["UK", "United Kingdom"],
      ["U.S.", "United States"],
      ["United states", "United States"],
      ["The Netherlands", "Netherlands"],
      ["Korea", "South Korea"],
      ["Czech Republic", "Czechia"],
    ].map(([a, b]) => [a.toLowerCase(), b]),
  );
  return map.get(c.toLowerCase()) || c;
}

function normalizeCountType(s) {
  const v = normString(s) || "Minimum";
  const l = v.toLowerCase();
  if (l.startsWith("estim")) return "Estimated";
  if (l.startsWith("act")) return "Actual";
  if (l.startsWith("min")) return "Minimum";
  return "Minimum";
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/* --------------------------- Supabase bootstrap -------------------------- */

assertEnv();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------------------------- Lookup fetchers ---------------------------- */

async function loadTechnologyMap() {
  const map = new Map();
  const { data, error } = await supabase.from("technologies").select("id,name");
  if (error) throw new Error(`Failed to load technologies: ${error.message}`);
  for (const t of data || []) {
    map.set(String(t.name).trim().toUpperCase(), t.id);
  }
  return map;
}

async function loadMaterialMap() {
  const map = new Map();
  const { data, error } = await supabase.from("materials").select("id,name");
  if (error) throw new Error(`Failed to load materials: ${error.message}`);
  for (const m of data || []) {
    map.set(String(m.name).trim().toUpperCase(), m.id);
  }
  return map;
}

async function findCompanyByName(name) {
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw new Error(`Query company failed: ${error.message}`);
  return data || null;
}

async function upsertCompany({
  name,
  website,
  country,
  state = null,
  company_type = "other",
  description = null,
}) {
  const existing = await findCompanyByName(name);
  if (existing) return existing.id;

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would insert company: ${name}`);
    return `dry-${Math.random().toString(36).slice(2, 10)}`;
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      website: normString(website),
      country: normalizeCountry(country),
      state: normString(state),
      company_type,
      description,
    })
    .select("id")
    .single();

  if (error) {
    if (
      String(error.message || "")
        .toLowerCase()
        .includes("duplicate key value")
    ) {
      const existing = await findCompanyByName(name);
      if (existing?.id) return existing.id;
    }
    throw new Error(`Insert company failed: ${error.message}`);
  }
  return data.id;
}

async function upsertCompanyCategory(company_id, category, is_primary = false) {
  // Use unique constraint (company_id, category)
  if (DRY_RUN) {
    console.log(
      `[DRY-RUN] Would insert company_category: ${company_id} - ${category}`,
    );
    return;
  }
  const { error } = await supabase.from("company_categories").insert({
    company_id,
    category,
    is_primary,
  });
  if (error && !String(error.message).includes("duplicate")) {
    console.warn(`WARN: Insert company_category failed: ${error.message}`);
  }
}

async function insertEquipmentBatch(batch) {
  if (!batch.length) return { inserted: 0, errors: 0 };
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would insert ${batch.length} equipment rows`);
    return { inserted: batch.length, errors: 0 };
  }
  const { error } = await supabase.from("equipment").insert(batch);
  if (error) {
    console.error(`ERROR: Insert equipment batch failed: ${error.message}`);
    return { inserted: 0, errors: batch.length };
  }
  return { inserted: batch.length, errors: 0 };
}

/* ------------------------------ Data loading ----------------------------- */

function loadCompanyInformation() {
  const rows = readJsonSafe(FILES.companyInfo, []);
  return rows
    .map((r) => ({
      name: normString(r["Company name"]),
      website: normString(r["Website"]),
      country: normalizeCountry(r["Headquarters"]),
    }))
    .filter((r) => r.name);
}

function loadSystemsManufacturers() {
  // These are manufacturers (equipment makers) – mark as company_type='equipment'
  const rows = readJsonSafe(FILES.systemsMfrs, []);
  return rows
    .map((r) => ({
      name: normString(r["Company name"]),
      country: normalizeCountry(r["Country"]),
      segment: normString(r["Segment"]), // "System manufacturer"
    }))
    .filter((r) => r.name);
}

function loadPrintServices() {
  const rows = readJsonSafe(FILES.printServices, []);
  return rows
    .map((r) => ({
      name: normString(r["Company name"]),
      segment: normString(r["Segment"]), // "Printing services"
      manufacturer: normString(r["Printer manufacturer"]),
      model: normString(r["Printer model"]),
      process: normString(r["Process"]),
      material: normString(r["Material type"]),
      count: Number.parseInt(r["Number of printers"]) || 1,
      count_type: normalizeCountType(r["Count type"]),
      country: normalizeCountry(r["Country"]),
      website: null, // not present in this JSON
    }))
    .filter((r) => r.name);
}

/* ------------------------------- Main logic ------------------------------ */

async function main() {
  console.log("Supabase URL:", SUPABASE_URL);
  console.log(
    "Key type:",
    SUPABASE_KEY?.startsWith("sb_secret_")
      ? "service_role"
      : "anon/publishable",
  );
  console.log("Dry run:", DRY_RUN ? "Yes" : "No");

  // Smoke test connection
  const ping = await supabase
    .from("technologies")
    .select("id", { head: true, count: "exact" });
  if (ping.error) {
    console.error("Connection test failed:", ping.error.message);
    process.exit(1);
  }

  // Load lookup maps
  const [technologyMap, materialMap] = await Promise.all([
    loadTechnologyMap(),
    loadMaterialMap(),
  ]);

  // Load source data
  const baseCompanies = loadCompanyInformation();
  const systemsMfrs = loadSystemsManufacturers();
  const printServices = loadPrintServices();

  console.log(
    `Loaded: companyInfo=${baseCompanies.length}, systemsMfrs=${systemsMfrs.length}, printServices rows=${printServices.length}`,
  );

  // Build a de-duplicated set of companies we plan to insert/update by name
  const companiesByName = new Map();

  for (const c of baseCompanies) {
    const key = c.name.toLowerCase();
    companiesByName.set(key, {
      name: c.name,
      website: c.website,
      country: c.country,
      company_type: "other",
    });
  }

  for (const c of systemsMfrs) {
    const key = c.name.toLowerCase();
    const existing = companiesByName.get(key);
    companiesByName.set(key, {
      name: c.name,
      website: existing?.website || null,
      country: c.country || existing?.country || null,
      company_type: "equipment",
    });
  }

  for (const r of printServices) {
    const key = r.name.toLowerCase();
    const existing = companiesByName.get(key);
    companiesByName.set(key, {
      name: r.name,
      website: existing?.website || null,
      country: r.country || existing?.country || null,
      company_type: "service",
    });
  }

  console.log(`Unique companies to process: ${companiesByName.size}`);

  // Upsert companies and remember IDs
  const companyIdByName = new Map();
  let companyInserted = 0;
  for (const [, c] of companiesByName) {
    const id = await upsertCompany(c);
    companyIdByName.set(c.name, id);
    if (!DRY_RUN) companyInserted++;
  }

  // Insert company categories
  for (const c of systemsMfrs) {
    const id = companyIdByName.get(c.name);
    if (id) await upsertCompanyCategory(id, "System manufacturer", true);
  }
  // For print services, also add category
  // Note: multiple entries for same company collapse due to upsertCompanyCategory unique pair constraint.
  for (const r of printServices) {
    const id = companyIdByName.get(r.name);
    if (id) await upsertCompanyCategory(id, "Printing services", true);
  }

  // Prepare equipment rows from print services JSON
  // We need to map process -> technology_id and material -> material_id
  const equipmentRecords = [];
  for (const r of printServices) {
    const company_id = companyIdByName.get(r.name);
    if (!company_id) continue;

    // Some rows may omit process or material; map to IDs where possible.
    const techId = r.process
      ? technologyMap.get(r.process.trim().toUpperCase())
      : null;
    const matId = r.material
      ? materialMap.get(r.material.trim().toUpperCase())
      : null;

    equipmentRecords.push({
      company_id,
      manufacturer: r.manufacturer || null,
      model: r.model || null,
      technology_id: techId || null,
      material_id: matId || null,
      count: r.count || 1,
      count_type: r.count_type || "Minimum",
    });
  }

  // Batch insert equipment
  let equipmentInserted = 0;
  let equipmentErrors = 0;
  for (let i = 0; i < equipmentRecords.length; i += BATCH_SIZE) {
    const batch = equipmentRecords.slice(i, i + BATCH_SIZE);
    const { inserted, errors } = await insertEquipmentBatch(batch);
    equipmentInserted += inserted;
    equipmentErrors += errors;
    if (!DRY_RUN) {
      console.log(
        `Inserted equipment: ${equipmentInserted}/${equipmentRecords.length} (+${inserted}), errors so far: ${equipmentErrors}`,
      );
    }
  }

  // Summary
  console.log("\n=== Import Summary ===");
  console.log(`Companies processed: ${companiesByName.size}`);
  console.log(
    `Companies inserted (new): ${DRY_RUN ? 0 : companyInserted} (existing reused not counted)`,
  );
  console.log(`Equipment rows prepared: ${equipmentRecords.length}`);
  console.log(`Equipment inserted: ${DRY_RUN ? 0 : equipmentInserted}`);
  console.log(`Equipment errors: ${equipmentErrors}`);
  console.log("Done.");
}

/* --------------------------------- Run ----------------------------------- */

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
