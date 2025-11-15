import { create } from 'zustand'

type Crud = { create: boolean; read: boolean; update: boolean; delete: boolean }

interface AclState {
  role: string
  permissions: Record<string, Crud>
  setRole: (role: string) => void
  setPermissions: (perms: Record<string, Crud>) => void
  loadForRole: (role: string) => Promise<void>
  can: (resource: string, action: keyof Crud) => boolean
}

export const useAclStore = create<AclState>()((set, get) => ({
  role: '',
  permissions: {},
  setRole: (role) => set((s) => ({ ...s, role })),
  setPermissions: (perms) => set((s) => ({ ...s, permissions: perms })),
  loadForRole: async (role) => {
    const res = await fetch(`/api/acl?role=${encodeURIComponent(role)}`)
    const list = await res.json()
    const perms: Record<string, Crud> = {}
    for (const p of list) {
      const r = String(p.resource || '')
      perms[r] = {
        create: Number(p.can_create || 0) === 1,
        read: Number(p.can_read || 0) === 1,
        update: Number(p.can_update || 0) === 1,
        delete: Number(p.can_delete || 0) === 1,
      }
    }
    set((s) => ({ ...s, role, permissions: perms }))
  },
  can: (resource, action) => {
    const p = get().permissions[resource]
    if (!p) return true
    return p[action]
  },
}))