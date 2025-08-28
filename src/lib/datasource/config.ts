export type DataSourceMode = 'csv' | 'supabase'

export function getDataSourceMode(): DataSourceMode {
  const v = (process.env.DATA_SOURCE || '').toLowerCase()
  return v === 'csv' ? 'csv' : 'supabase'
}

export function isCsvMode(): boolean {
  return getDataSourceMode() === 'csv'
}

export function getDataRoot(): string {
  // Allow override via env; otherwise default to repo-local project documents
  const fromEnv = process.env.DATA_DIR
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv
  // Default relative path for local development
  return `${process.cwd()}/project-documents/04-data/extracted-vendor-data`
}

