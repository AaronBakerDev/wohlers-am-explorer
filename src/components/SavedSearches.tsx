"use client"

// Note: This component is feature-gated at the call site.
// It will not render unless `NEXT_PUBLIC_ENABLE_SAVED_SEARCHES` is enabled.
// See `src/lib/flags.ts` and `.env.local.example` for details.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listSavedSearches, createSavedSearch, deleteSavedSearch } from '@/lib/user/client'

type SavedSearch = {
  id: string
  name: string
  query: Record<string, unknown>
  created_at: string
}

export default function SavedSearches({ currentQuery }: { currentQuery?: Record<string, unknown> }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<SavedSearch[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const data = await listSavedSearches()
      setItems(data as SavedSearch[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onSave = async () => {
    try {
      await createSavedSearch(name || 'My search', currentQuery ?? {})
      setName('')
      refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const onDelete = async (id: string) => {
    await deleteSavedSearch(id)
    refresh()
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Saved Searches</h2>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this search" className="h-8 w-48" />
          <Button size="sm" onClick={onSave} disabled={loading}>Save current</Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {items.length === 0 && <li className="text-sm text-muted-foreground">No saved searches yet.</li>}
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>{s.name}</span>
              <Button variant="outline" size="sm" onClick={() => onDelete(s.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
