import { ReportPlaceholder } from "@/components/report-placeholder"

export default function AmericaMakesPage() {
  const metrics = [
    { label: "Member Organizations", value: "234", change: "Active membership" },
    { label: "Research Projects", value: "67", change: "Funded initiatives" },
    { label: "Technology Areas", value: "12", change: "Focus domains" },
    { label: "Total Investment", value: "$180M", change: "Program funding" },
  ]

  const insights = [
    { type: "Mission", description: "Accelerating AM innovation and adoption in US manufacturing" },
    { type: "Partnership", description: "Public-private collaboration driving technology advancement" },
    { type: "Education", description: "Workforce development programs reaching 15,000+ students annually" },
  ]

  return (
    <ReportPlaceholder
      title="America Makes Member Report"
      description="Analysis of America Makes institute membership, programs, and impact on US additive manufacturing ecosystem"
      metrics={metrics}
      insights={insights}
      additionalInfo="This report examines America Makes' role as the national accelerator for additive manufacturing innovation, including member activities, research programs, and technology transfer initiatives."
    />
  )
}