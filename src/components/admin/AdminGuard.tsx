"use client"

import { useEffect, useState } from "react"
import { getCurrentUserProfile } from "@/lib/user/client"
import type { UserRole } from "@/lib/auth/roles"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const profile = await getCurrentUserProfile()
        if (!isMounted) return
        setRole(profile?.role ?? null)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
        Checking access…
      </div>
    )
  }

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-lg font-semibold">Admin access required</p>
          <p className="text-sm text-muted-foreground">You don’t have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

