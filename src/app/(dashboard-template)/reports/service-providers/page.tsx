import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

export default function ServiceProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Providers Report</h1>
          <p className="text-muted-foreground">
            Analysis of additive manufacturing service bureaus and contract manufacturers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              Active service bureaus
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Types</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Different service categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geographic Coverage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31</div>
            <p className="text-xs text-muted-foreground">
              Countries served
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Turnaround</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.2</div>
            <p className="text-xs text-muted-foreground">
              Days average delivery
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Overview</CardTitle>
          <CardDescription>
            Comprehensive analysis of additive manufacturing service providers, capabilities, and market trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Growth</Badge>
                  <span>Service bureau market expanding 18% annually</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Specialization</Badge>
                  <span>Increasing focus on industry-specific solutions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Technology</Badge>
                  <span>Multi-technology providers becoming more common</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                This is a placeholder report page. Full implementation will include service provider profiles, 
                pricing analysis, capability mapping, and quality certifications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}