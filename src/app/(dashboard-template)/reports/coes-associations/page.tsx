import { ReportPlaceholder } from "@/components/report-placeholder"

export default function COEsAssociationsPage() {
  const metrics = [
    { label: "Centers of Excellence", value: "34", change: "Active research centers" },
    { label: "Industry Associations", value: "12", change: "Major organizations" },
    { label: "Research Projects", value: "127", change: "Ongoing initiatives" },
    { label: "Total Funding", value: "$245M", change: "Research investment" },
  ]

  const insights = [
    { type: "Research", description: "AI integration becoming primary focus area across COEs" },
    { type: "Collaboration", description: "Industry-academia partnerships increasing 28% annually" },
    { type: "Standards", description: "New certification programs launched by 8 associations" },
  ]

  return (
    <ReportPlaceholder
      title="COE's and Associations Report"
      description="Analysis of Centers of Excellence, industry associations, and research initiatives driving AM innovation"
      metrics={metrics}
      insights={insights}
      additionalInfo="This report covers research institutions, industry associations, standards bodies, and collaborative initiatives advancing additive manufacturing technology and adoption."
    />
  )
}