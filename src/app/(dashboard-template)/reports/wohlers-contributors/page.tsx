import { ReportPlaceholder } from "@/components/report-placeholder"

export default function WohlersContributorsPage() {
  const metrics = [
    { label: "Contributors", value: "89", change: "Global expert network" },
    { label: "Countries", value: "31", change: "International coverage" },
    { label: "Research Areas", value: "15", change: "Specialized domains" },
    { label: "Years Experience", value: "12.4", change: "Average expertise" },
  ]

  const insights = [
    { type: "Expertise", description: "Deep industry knowledge spanning all AM technology areas" },
    { type: "Network", description: "Contributors represent 70% of major AM companies globally" },
    { type: "Research", description: "Combined 1,100+ years of additive manufacturing experience" },
  ]

  return (
    <ReportPlaceholder
      title="Wohlers Report Contributors"
      description="Profiles and contributions of expert network supporting Wohlers Report research and analysis"
      metrics={metrics}
      insights={insights}
      additionalInfo="This report recognizes the extensive network of industry experts, researchers, and practitioners who contribute to Wohlers Associates market intelligence and analysis."
    />
  )
}