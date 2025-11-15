import { useQuery } from '@tanstack/react-query'

type RoleItem = { id: string; name: string; description?: string }

async function fetchRoles(): Promise<RoleItem[]> {
  const res = await fetch('/api/roles')
  if (!res.ok) return []
  return res.json()
}

export function useRoles() {
  const query = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const options = (query.data || []).map((r) => ({ label: r.name, value: r.name }))
  return { roles: query.data || [], roleOptions: options, loading: query.isLoading, error: query.error ? (query.error as Error).message : null }
}