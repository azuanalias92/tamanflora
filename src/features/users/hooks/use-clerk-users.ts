import { useEffect, useState } from 'react'
import type { User } from '../data/schema'
import { users as mockUsers } from '../data/users'

export function useClerkUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        setError(null)

        // For demo purposes, use mock users
        // In a real implementation, you would fetch from Clerk API
        const mockClerkUsers: User[] = mockUsers.slice(0, 50).map(user => ({
          ...user,
          // Ensure all users have proper IDs and metadata
          id: user.id,
          status: user.status || 'active',
          role: (user.role as User['role']) || 'owner',
        }))

        setUsers(mockClerkUsers)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Function to update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update user role')
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole, updatedAt: new Date() } : user
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Error updating user role:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update user role' }
    }
  }

  return { users, loading, error, updateUserRole }
}