import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

export default function SystemManufacturerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Manufacturer Report</h1>
          <p className="text-muted-foreground">
            Analysis of additive manufacturing system manufacturers and equipment providers
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
            <CardTitle className="text-sm font-medium">Total Manufacturers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Types</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Different equipment categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Leaders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Top tier manufacturers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Reach</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Countries represented
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Overview</CardTitle>
          <CardDescription>
            This report provides comprehensive analysis of system manufacturers in the additive manufacturing industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Trend</Badge>
                  <span>Industrial-grade systems showing 15% growth year-over-year</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Market</Badge>
                  <span>Metal printing systems dominating high-value segments</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="secondary">Geography</Badge>
                  <span>North America and Europe lead in system manufacturing</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                This is a placeholder report page. Full report implementation will include detailed charts, 
                manufacturer profiles, market segmentation analysis, and export functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}