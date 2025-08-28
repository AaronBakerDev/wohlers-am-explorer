"use client"

import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/auth/roles'

export type UserProfile = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

export type UserPreferences = {
  user_id: string
  theme: 'system' | 'light' | 'dark'
  default_filters: Record<string, any>
  export_preferences: Record<string, any>
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  // AUTH DISABLED - Return mock user profile
  return {
    user_id: 'dev-user',
    full_name: 'Development User',
    avatar_url: null,
    role: 'admin' as UserRole
  }
  
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, avatar_url, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return (data as any) as UserProfile | null
  */
}

export async function upsertUserProfile(update: Partial<UserProfile>) {
  // AUTH DISABLED - No-op
  return
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) throw new Error('Not authenticated')
  const payload = { user_id: userId, ...update }
  const { error } = await supabase.from('profiles').upsert(payload)
  if (error) throw error
  */
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  // AUTH DISABLED - Return default preferences
  return {
    user_id: 'dev-user',
    theme: 'system',
    default_filters: {},
    export_preferences: {}
  }
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as any
  */
}

export async function upsertUserPreferences(update: Partial<UserPreferences>) {
  // AUTH DISABLED - No-op
  return
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) throw new Error('Not authenticated')
  const payload = { user_id: userId, ...update }
  const { error } = await supabase.from('user_preferences').upsert(payload)
  if (error) throw error
  */
}

export async function listSavedSearches() {
  // AUTH DISABLED - Return empty array
  return []
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) return []
  const { data, error } = await supabase
    .from('saved_searches')
    .select('id, name, query, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
  */
}

export async function createSavedSearch(name: string, query: any) {
  // AUTH DISABLED - No-op
  return
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) throw new Error('Not authenticated')
  const { error } = await supabase.from('saved_searches').insert({ user_id: userId, name, query })
  if (error) throw error
  */
}

export async function deleteSavedSearch(id: string) {
  // AUTH DISABLED - No-op
  return
  /* ORIGINAL AUTH CODE
  const supabase = createClient()
  const { error } = await supabase.from('saved_searches').delete().eq('id', id)
  if (error) throw error
  */
}

