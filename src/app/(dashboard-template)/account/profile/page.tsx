"use client"

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCurrentUserProfile, upsertUserProfile, getUserPreferences, upsertUserPreferences } from '@/lib/user/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const profile = await getCurrentUserProfile()
        if (!active) return
        if (profile) {
          setFullName(profile.full_name || '')
          setAvatarUrl(profile.avatar_url)
        }
        const prefs = await getUserPreferences()
        if (!active) return
        if (prefs) setTheme(prefs.theme as 'system' | 'light' | 'dark')
      } catch {}
    })()
    return () => { active = false }
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await Promise.all([
        upsertUserProfile({ full_name: fullName, avatar_url: avatarUrl || undefined }),
        upsertUserPreferences({ theme }),
      ])
      setMessage('Profile updated')
    } catch (e: unknown) {
      setMessage((e as Error)?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (file: File) => {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id
    if (!userId) return
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
      setMessage('Upload failed: ' + error.message)
      return
    }
    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl.publicUrl)
  }

  const onSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-4">Your Profile</h1>
        <div className="flex gap-6 items-start flex-wrap">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">No avatar</div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
            }} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Upload Avatar</Button>
          </div>
          <div className="flex-1 min-w-[260px] space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Theme preference</label>
              <Select value={theme} onValueChange={(v: 'system' | 'light' | 'dark') => setTheme(v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Theme" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
              <Button variant="outline" onClick={onSignOut}>Sign out</Button>
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

