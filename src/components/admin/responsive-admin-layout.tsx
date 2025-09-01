'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Shield,
  Building2,
  Database,
  Menu
} from 'lucide-react'

const adminRoutes = [
  {
    href: '/admin',
    label: 'Overview',
    icon: Shield,
    exact: true
  },
  {
    href: '/admin/companies',
    label: 'Companies',
    icon: Building2
  }
]

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Admin Panel</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Database className="h-3 w-3" />
          <span>{(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {adminRoutes.map((route) => {
          const isActive = route.exact 
            ? pathname === route.href 
            : pathname.startsWith(route.href) && pathname !== '/admin'
          
          return (
            <Link 
              key={route.href} 
              href={route.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Database management for AM market intelligence
        </div>
      </div>
    </div>
  )
}

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function ResponsiveAdminLayout({ 
  children, 
  title = "Admin Panel",
  description,
  actions 
}: ResponsiveAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r border-border">
        <AdminSidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex flex-col flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">{title}</h1>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-4 md:p-6 border-b border-border bg-background">
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
        
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </SheetTitle>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
