import React, { useState } from 'react'
import { useRoles } from '../hooks/use-roles'
import useDialogState from '@/hooks/use-dialog-state'
import { type User } from '../data/schema'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  roleList: Array<{ id: string; name: string; description?: string }>
  roleOptions: Array<{ label: string; value: string }>
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const { roles: roleList, roleOptions } = useRoles()

  return (
    <UsersContext.Provider value={{ open, setOpen, currentRow, setCurrentRow, roleList, roleOptions }}>
      {children}
    </UsersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsersContext = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsersContext has to be used within <UsersContext>')
  }

  return usersContext
}
