import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

interface ReportPlaceholderProps {
  title: string
  description: string
  metrics: Array<{
    label: string
    value: string
    change?: string
  }>
  insights: Array<{
    type: string
    description: string
  }>
  additionalInfo?: string
}

export function ReportPlaceholder({ 
  title, 
  description, 
  metrics, 
  insights,
  additionalInfo = "This is a placeholder report page. Full implementation will include detailed charts, data analysis, and export functionality."
}: ReportPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Overview</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-2 text-sm">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Badge variant="secondary">{insight.type}</Badge>
                    <span>{insight.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{additionalInfo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}