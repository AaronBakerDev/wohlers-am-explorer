"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ComponentType } from "react"

type IconType = ComponentType<{ className?: string }>

type KpiCardProps = {
  title: string
  value: React.ReactNode
  subtitle?: React.ReactNode
  icon?: IconType
  // Optional size control to render a more compact card
  // - 'sm' keeps the current look
  // - 'xs' makes everything denser (smaller paddings + typography)
  size?: 'sm' | 'xs' | 'xxs'
}

export function KpiCard({ title, value, subtitle, icon: Icon, size = 'sm' }: KpiCardProps) {
  const cardClass =
    size === 'xxs' ? 'py-1.5 gap-1.5 rounded-lg' : size === 'xs' ? 'py-2 gap-2 rounded-lg' : 'py-4 gap-3'
  const headerClass =
    size === 'xxs'
      ? 'flex flex-row items-center justify-between space-y-0 pb-1 px-3'
      : size === 'xs'
      ? 'flex flex-row items-center justify-between space-y-0 pb-0.5 px-3'
      : 'flex flex-row items-center justify-between space-y-0 pb-1 px-4'
  const titleClass =
    size === 'xxs' ? 'text-xs font-medium' : size === 'xs' ? 'text-[11px] font-medium' : 'text-xs font-medium'
  const iconClass =
    size === 'xxs' ? 'h-3.5 w-3.5 text-muted-foreground' : size === 'xs' ? 'h-3.5 w-3.5 text-muted-foreground' : 'h-4 w-4 text-muted-foreground'
  const contentClass = size === 'xxs' ? 'px-3 pt-1.5 pb-4' : size === 'xs' ? 'px-3 py-1.5' : 'px-4 py-2'
  const valueClass = size === 'xxs' ? 'text-lg font-bold' : size === 'xs' ? 'text-lg font-bold' : 'text-xl font-bold'
  const subtitleClass = size === 'xxs' ? 'text-xs text-muted-foreground' : size === 'xs' ? 'text-[11px] text-muted-foreground' : 'text-xs text-muted-foreground'
  return (
    <Card className={cardClass}>
      <CardHeader className={headerClass}>
        <CardTitle className={titleClass}>{title}</CardTitle>
        {Icon ? <Icon className={iconClass} /> : null}
      </CardHeader>
      <CardContent className={contentClass}>
        <div className={valueClass}>{value}</div>
        {subtitle ? (
          <p className={subtitleClass}>{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
