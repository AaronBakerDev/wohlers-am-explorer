import { ReportPlaceholder } from "@/components/report-placeholder"

export default function ICAMPage() {
  const metrics = [
    { label: "ICAM Members", value: "156", change: "Active participants" },
    { label: "Research Projects", value: "23", change: "Ongoing initiatives" },
    { label: "Partner Organizations", value: "45", change: "Collaborative network" },
    { label: "Publications", value: "78", change: "Research outputs" },
  ]

  const insights = [
    { type: "Focus", description: "Advanced manufacturing research and technology development" },
    { type: "Collaboration", description: "Strong industry-government-academia partnerships" },
    { type: "Impact", description: "Direct influence on national manufacturing policy" },
  ]

  return (
    <ReportPlaceholder
      title="ICAM Report"
      description="Analysis of Institute for Critical and Applied Materials activities, research, and impact on AM industry"
      metrics={metrics}
      insights={insights}
      additionalInfo="This report covers ICAM's role in advancing critical materials research, manufacturing technology development, and strategic initiatives in additive manufacturing."
    />
  )
}