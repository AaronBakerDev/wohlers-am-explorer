"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  X,
} from "lucide-react";
import ExportButton from "@/components/ExportButton";
import type { ColumnDef } from "@/lib/export";

type ApiCompanyItem = {
  id: string;
  name: string;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  company_type: string | null;
  funding: {
    rounds: number;
    totalMillions: number;
    lastYear: number | null;
  };
  categories: string[];
};

const ALL_TYPES = [
  { value: "all", label: "All" },
  { value: "equipment", label: "Equipment" },
  { value: "service", label: "Service" },
  { value: "software", label: "Software" },
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
] as const;

const ALL_COUNTRIES = [
  "all",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Canada",
  "China",
  "Japan",
  "Netherlands",
] as const;

const PER_PAGE = 10;

export default function DirectoryContent() {
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all"); // maps to company_type
  const [country, setCountry] = useState<string>("all");
  const [minRevenue, setMinRevenue] = useState<string>("0"); // mapped to minFunding on API
  const [hasFunding, setHasFunding] = useState<boolean>(false);

  // Dynamic filter options (fallback to static lists if API fails)
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);

  // Data
  const [items, setItems] = useState<ApiCompanyItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Pagination/loading
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Debounce text inputs to avoid network thrash during fast typing
  const debouncedSearch = useDebouncedValue(search, 350)
  const debouncedMinRevenue = useDebouncedValue(minRevenue, 350)

  // Fetch from API whenever filters/page change
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (category !== "all") params.set("type", category);
        if (country !== "all") params.set("country", country);
        if (hasFunding) params.set("hasFunding", "true");
        if (debouncedMinRevenue && Number(debouncedMinRevenue) > 0)
          params.set("minFunding", String(Number(debouncedMinRevenue)));
        params.set("page", String(page));
        params.set("perPage", String(PER_PAGE));

        const res = await fetch(`/api/companies/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as {
          data: {
            items: ApiCompanyItem[];
            page: number;
            perPage: number;
            total: number;
          };
        };
        setItems(json.data.items || []);
        setTotal(json.data.total || 0);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          // basic fallback
          setItems([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [debouncedSearch, category, country, debouncedMinRevenue, hasFunding, page]);

  // Load dynamic filter option lists
  useEffect(() => {
    let cancelled = false
    async function loadFilters() {
      try {
        const res = await fetch('/api/companies/filters')
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!cancelled) {
          const types = Array.isArray(data.types) ? (['all', ...data.types]) : []
          const countries = Array.isArray(data.countries) ? (['all', ...data.countries]) : []
          setTypeOptions(types)
          setCountryOptions(countries)
        }
      } catch {
        if (!cancelled) {
          setTypeOptions(ALL_TYPES.map(t => t.value))
          setCountryOptions(Array.from(ALL_COUNTRIES))
        }
      }
    }
    loadFilters()
    return () => { cancelled = true }
  }, [])

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
    setCategory("all");
    setCountry("all");
    setMinRevenue("0");
    setHasFunding(false);
    setPage(1);
  };

  // Export handled by shared ExportButton component

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const exportColumns: ColumnDef<ApiCompanyItem>[] = [
    { key: 'name', header: 'Company Name' },
    { key: 'country', header: 'Country' },
    { key: 'company_type', header: 'Category' },
    { key: 'website', header: 'Website' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'categories', header: 'Categories', map: (r) => (r.categories || []).join(';') },
    { key: 'funding', header: 'Funding Total ($M)', map: (r) => r.funding?.totalMillions ?? 0 },
    { key: 'funding', header: 'Funding Rounds', map: (r) => r.funding?.rounds ?? 0 },
    { key: 'funding', header: 'Last Funding Year', map: (r) => r.funding?.lastYear ?? '' },
  ];

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Company Directory</h1>
          <Badge variant="outline" className="text-xs">{total} results</Badge>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={items}
            columns={exportColumns}
            filenameBase="directory-export"
            size="sm"
            align="end"
          />
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
          <CardDescription className="text-xs">Refine directory results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search companies, locations, technologies..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchDraft); setPage(1) } }}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => { setSearch(searchDraft); setPage(1) }}>
                Search
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
              <ExportButton
                data={items}
                columns={exportColumns}
                filenameBase="directory-export"
                size="sm"
                align="end"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(typeOptions.length ? typeOptions : ALL_TYPES.map(t => t.value)).map((val) => (
                    <SelectItem key={val} value={val}>
                      {val === 'all' ? 'All' : val.charAt(0).toUpperCase() + val.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1) }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(countryOptions.length ? countryOptions : Array.from(ALL_COUNTRIES)).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="minRevenue">Min Funding ($M)</Label>
              <Input
                id="minRevenue"
                type="number"
                min={0}
                className="h-8"
                value={minRevenue}
                onChange={(e) => setMinRevenue(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="invisible block">Has Funding</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="hasFunding" checked={hasFunding} onCheckedChange={(v) => setHasFunding(Boolean(v))} />
                <Label htmlFor="hasFunding" className="text-sm">Has funding</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Funding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    {item.website ? (
                      <a
                        className="hover:underline"
                        href={item.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{item.city ?? "—"}, {item.state ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{item.country ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{item.company_type ?? "—"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">${item.funding?.totalMillions ?? 0}M</div>
                  <div className="text-xs text-muted-foreground">{item.funding?.rounds ?? 0} rounds</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.categories?.map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {item.website ? (
                    <a className="hover:underline" href={item.website} target="_blank" rel="noreferrer">
                      {item.name}
                    </a>
                  ) : item.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {(item.city ?? '—')}, {(item.state ?? '—')} • {item.country ?? '—'}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-[10px] capitalize">{item.company_type ?? '—'}</Badge>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">${item.funding?.totalMillions ?? 0}M • {item.funding?.rounds ?? 0} rounds</div>
              <div className="flex flex-wrap gap-1">
                {(item.categories || []).slice(0, 3).map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                ))}
                {(item.categories || []).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{(item.categories || []).length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">No results found.</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
