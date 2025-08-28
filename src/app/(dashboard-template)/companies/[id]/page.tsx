import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  getCompany,
  getInvestmentsByCompany,
  getMergersAcquisitionsByCompany,
  getServicePricingByCompany,
} from "@/lib/supabase/queries";

function formatMonthYear(year?: number | null, month?: string | null) {
  if (!year) return "—";
  const m = month && month.trim() ? month.trim() : "";
  return m ? `${m} ${year}` : String(year);
}

interface CompanyProfilePageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function CompanyProfilePage(props: CompanyProfilePageProps) {
  const p =
    props?.params && typeof (props.params as any)?.then === "function"
      ? await (props.params as Promise<{ id: string }>)
      : props?.params;
  const id = p?.id as string;
  const company = await getCompany(id);

  if (!company) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Company not found
        </h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a company with id {id}.
        </p>
      </div>
    );
  }

  const [investments, maDeals, pricing] = await Promise.all([
    getInvestmentsByCompany(company.id),
    getMergersAcquisitionsByCompany(company.id),
    getServicePricingByCompany(company.id),
  ]);

  // Compute equipment summary
  const totalMachines = (company.equipment || []).reduce(
    (sum, e) => sum + (e.count ?? 0),
    0,
  );
  const uniqueProcesses = new Set<string>();
  const uniqueMaterials = new Set<string>();
  const uniqueManufacturers = new Set<string>();
  for (const e of company.equipment || []) {
    const proc = (e as any)?.process as string | undefined
    const mat = (e as any)?.material as string | undefined
    if (proc) uniqueProcesses.add(proc)
    if (mat) uniqueMaterials.add(mat)
    if ((e as any).manufacturer) uniqueManufacturers.add((e as any).manufacturer as string)
  }

  // Funding aggregates
  const fundingRounds = investments.length;
  const totalFundingMillions = investments.reduce(
    (sum, r) => sum + (Number(r.amount_millions) || 0),
    0,
  );
  const lastFundingYear =
    investments.reduce<number | null>((max, r) => {
      const y = r.investment_year != null ? Number(r.investment_year) : null;
      if (y == null) return max;
      if (max == null) return y;
      return y > max ? y : max;
    }, null) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {company.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Company profile overview powered by live Supabase data. ID:{" "}
          {company.id}
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Core company details and key metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Follow
            </Button>
            <Button size="sm">View in Analytics</Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Company</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">
                {company.company_type
                  ? company.company_type.charAt(0).toUpperCase() +
                    company.company_type.slice(1)
                  : "—"}
              </div>
              <div className="text-muted-foreground">Country</div>
              <div className="font-medium">{company.country ?? "—"}</div>
              <div className="text-muted-foreground">State/Province</div>
              <div className="font-medium">{company.state ?? "—"}</div>
              <div className="text-muted-foreground">City</div>
              <div className="font-medium">{company.city ?? "—"}</div>
              <div className="text-muted-foreground">Website</div>
              <div className="font-medium">{company.website ?? "—"}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Funding</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Funding Rounds</div>
              <div className="font-medium">{fundingRounds}</div>
              <div className="text-muted-foreground">Last Funding</div>
              <div className="font-medium">{lastFundingYear ?? "—"}</div>
              <div className="text-muted-foreground">Total Funding</div>
              <div className="font-medium">
                ${totalFundingMillions.toLocaleString()}M
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Equipment Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Total Machines</div>
              <div className="font-medium">{totalMachines}</div>
              <div className="text-muted-foreground">Unique Processes</div>
              <div className="font-medium">{uniqueProcesses.size}</div>
              <div className="text-muted-foreground">Unique Materials</div>
              <div className="font-medium">{uniqueMaterials.size}</div>
              <div className="text-muted-foreground">Manufacturers</div>
              <div className="font-medium">{uniqueManufacturers.size}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments */}
      <Card>
        <CardHeader>
          <CardTitle>Investments</CardTitle>
          <CardDescription>Funding rounds and investors</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Amount ($M)</TableHead>
                <TableHead>Lead Investor</TableHead>
                <TableHead>Country</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      No investments recorded.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {formatMonthYear(
                        inv.investment_year,
                        inv.investment_month,
                      )}
                    </TableCell>
                    <TableCell>{inv.funding_round ?? "—"}</TableCell>
                    <TableCell>
                      {(inv.amount_millions ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.lead_investor ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.country ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* M&A Activity */}
      <Card>
        <CardHeader>
          <CardTitle>M&A Activity</CardTitle>
          <CardDescription>Acquisitions and mergers</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Acquirer</TableHead>
                <TableHead>Acquired</TableHead>
                <TableHead>Amount ($M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      No M&amp;A activity recorded.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                maDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">
                      {deal.announcement_date ?? "—"}
                    </TableCell>
                    <TableCell>{deal.acquiring_company_name}</TableCell>
                    <TableCell>{deal.acquired_company_name}</TableCell>
                    <TableCell>
                      {deal.deal_size_millions != null
                        ? Number(deal.deal_size_millions).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Intelligence</CardTitle>
          <CardDescription>Observed service pricing (USD)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead className="hidden md:table-cell">Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Lead Time (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      No pricing records available.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pricing.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.process ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.specific_material ?? p.material_category ?? "—"}
                    </TableCell>
                    <TableCell>{p.quantity ?? "—"}</TableCell>
                    <TableCell>
                      {p.price_usd != null
                        ? Number(p.price_usd).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{p.lead_time_days ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
