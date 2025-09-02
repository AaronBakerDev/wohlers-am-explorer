"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter as FilterIcon } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

type IconType = ComponentType<{ className?: string }>

type FilterCardProps = {
  title?: string
  icon?: IconType
  children: ReactNode
  // Optional size control to shrink paddings/typography
  size?: 'sm' | 'xs' | 'xxs'
}

export function FilterCard({ title = "Filters", icon: Icon = FilterIcon, children, size = 'sm' }: FilterCardProps) {
  const cardClass = size === 'xxs' ? 'py-1.5 gap-1.5 rounded-lg' : size === 'xs' ? 'py-2 gap-2 rounded-lg' : 'py-4 gap-3'
  const headerClass = size === 'xxs' ? 'px-3 py-1.5' : size === 'xs' ? 'px-3 py-1.5' : 'px-4 py-2'
  const titleClass = size === 'xxs' ? 'text-xs flex items-center gap-2' : size === 'xs' ? 'text-sm flex items-center gap-2' : 'text-sm flex items-center gap-2'
  const iconClass = size === 'xxs' ? 'h-3.5 w-3.5' : size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const contentClass = size === 'xxs' ? 'px-3 pt-0 pb-4' : size === 'xs' ? 'px-3 pt-0 pb-2' : 'px-4 pt-0 pb-3'
  return (
    <Card className={cardClass}>
      <CardHeader className={headerClass}>
        <CardTitle className={titleClass}>
          <Icon className={iconClass} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClass}>
        {children}
      </CardContent>
    </Card>
  )
}
