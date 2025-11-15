import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { useAclStore } from '@/stores/acl-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { user, accessToken } = useAuthStore.getState().auth
    if (!user || !accessToken) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }

    const roles = Array.isArray(user.role) ? user.role : []
    const isGuard = roles.includes('guard')
    if (isGuard) {
      const href = location.href || ''
      const path = href.split('?')[0].split('#')[0]
      const allowed = ['/check-in', '/check-in-logs']
      const isAllowed = allowed.some((p) => path.startsWith(p))
      if (!isAllowed) {
        throw redirect({ to: '/errors/$error', params: { error: 'forbidden' } })
      }
    }

    // Load ACL permissions for the user's role
    const userRole = Array.isArray(user.role) ? user.role[0] : user.role
    if (userRole) {
      await useAclStore.getState().loadForRole(userRole)
    }

    const href = location.href || ''
    const path = href.split('?')[0].split('#')[0]
    const seg = path.split('/').filter(Boolean)[0] || ''
    const resource = seg ? `/${seg}` : '/'
    const canRead = useAclStore.getState().can(resource, 'read')
    if (!canRead) {
      throw redirect({ to: '/errors/$error', params: { error: 'forbidden' } })
    }
  },
  component: AuthenticatedLayout,
})
