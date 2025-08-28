import { ReportPlaceholder } from "@/components/report-placeholder"

export default function MergersAcquisitionPage() {
  const metrics = [
    { label: "Total M&A Deals", value: "47", change: "+23% from last year" },
    { label: "Deal Value", value: "$2.8B", change: "Total transaction volume" },
    { label: "Active Acquirers", value: "18", change: "Strategic buyers" },
    { label: "Avg Deal Size", value: "$59M", change: "+15% vs previous year" },
  ]

  const insights = [
    { type: "Trend", description: "Consolidation accelerating in metal printing segment" },
    { type: "Geography", description: "Cross-border acquisitions increasing by 34%" },
    { type: "Strategy", description: "Vertical integration driving 60% of deals" },
  ]

  return (
    <ReportPlaceholder
      title="Mergers & Acquisition Report"
      description="Analysis of M&A activity, deal flow, and consolidation trends in the additive manufacturing industry"
      metrics={metrics}
      insights={insights}
      additionalInfo="This report tracks all major M&A transactions, strategic partnerships, and market consolidation activities across the AM ecosystem."
    />
  )
}