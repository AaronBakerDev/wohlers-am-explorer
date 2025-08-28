export type UserRole = 'basic' | 'premium' | 'admin'

export function canAccessAnalytics(role: UserRole | null | undefined) {
  return role === 'premium' || role === 'admin'
}

export function isAdmin(role: UserRole | null | undefined) {
  return role === 'admin'
}

