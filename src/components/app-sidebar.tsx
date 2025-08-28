"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { 
  Home,
  MapPin,
  Table,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  Circle,
  FileText,
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Map Explorer",
    url: "/map", 
    icon: MapPin,
  },
  {
    title: "Data Table",
    url: "/data-table",
    icon: Table,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
]

const reportItems = [
  {
    title: "System Manufacturer",
    url: "/reports/system-manufacturer",
    icon: FileText,
  },
  {
    title: "AM Material Producers", 
    url: "/reports/am-material-producers",
    icon: FileText,
  },
  {
    title: "Service Providers",
    url: "/reports/service-providers", 
    icon: FileText,
  },
  {
    title: "Aggregated Data",
    url: "/reports/aggregated-data",
    icon: FileText,
  },
  {
    title: "Mergers & Acquisition",
    url: "/reports/mergers-acquisition",
    icon: FileText,
  },
  {
    title: "COE's and Associations", 
    url: "/reports/coes-associations",
    icon: FileText,
  },
  {
    title: "Wohlers Report Contributors",
    url: "/reports/wohlers-contributors",
    icon: FileText,
  },
  {
    title: "ICAM",
    url: "/reports/icam", 
    icon: FileText,
  },
  {
    title: "America Makes Member",
    url: "/reports/america-makes",
    icon: FileText,
  },
]

const recentFilters = [
  {
    name: "Equipment Manufacturers",
    id: "FILTER-001",
    color: "text-chart-5",
    count: 45
  },
  {
    name: "Service Providers", 
    id: "FILTER-002",
    color: "text-chart-2",
    count: 23
  },
  {
    name: "SLA Technology",
    id: "FILTER-003", 
    color: "text-chart-3",
    count: 12
  },
  {
    name: "California Companies",
    id: "FILTER-004",
    color: "text-chart-4", 
    count: 8
  }
]

export function AppSidebar() {
  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sidebar-primary rounded flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-semibold text-xs">W</span>
          </div>
          <div>
            <h1 className="font-medium text-sm text-sidebar-foreground">Wohlers AM Explorer</h1>
            <p className="text-xs text-muted-foreground">Market Analysis Platform</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        {/* Quick Actions - Linear style */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-xs">Search...</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">⌘K</Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">New Task</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">⌘N</Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="text-xs">Notifications</span>
                  <Badge className="ml-auto text-[10px] bg-sidebar-primary text-sidebar-primary-foreground">3</Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="border-t border-sidebar-border pt-2">
          <SidebarGroupLabel className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="gap-2 px-3 py-2 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reports */}
        <SidebarGroup className="border-t border-sidebar-border pt-2">
          <SidebarGroupLabel className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="gap-2 px-3 py-2 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Filters */}
        <SidebarGroup className="border-t border-sidebar-border pt-2">
          <SidebarGroupLabel className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center justify-between">
            <span>Recent Filters</span>
            <Plus className="h-3 w-3 cursor-pointer hover:text-sidebar-foreground text-subtle" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {recentFilters.map((filter) => (
                <SidebarMenuItem key={filter.id}>
                  <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                    <Circle className={`h-2 w-2 ${filter.color} fill-current flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate text-sidebar-foreground">{filter.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-subtle font-mono">{filter.id}</span>
                        <span className="text-[10px] text-subtle">
                          {filter.count} companies
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border bg-sidebar">
        <SidebarMenu className="space-y-0">
          <SidebarMenuItem>
            <ThemeSwitcher />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
              <Settings className="h-3.5 w-3.5" />
              <span className="text-xs">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/avatars/user.jpg" />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">YU</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-sidebar-foreground">Your Name</p>
                <p className="text-[10px] text-subtle">your.email@domain.com</p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
