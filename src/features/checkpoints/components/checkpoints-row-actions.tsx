import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CheckpointDialog } from './checkpoint-dialog'
import { type Checkpoint, type CheckpointFormData } from '../data/schema'
import { MoreHorizontal, Edit, Trash } from 'lucide-react'
import { useAclStore } from '@/stores/acl-store'

interface DataTableRowActionsProps {
  row: Row<Checkpoint>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { can } = useAclStore()
  const canUpdate = can('/checkpoints', 'update')
  const canDelete = can('/checkpoints', 'delete')

  const checkpoint = row.original

  const handleEdit = async (_data: CheckpointFormData) => {
    // In a real app, this would call an API
    // console.log('Edit checkpoint:', checkpoint.id, data)
    // Update the mock data or make API call
  }

  const handleDelete = async () => {
    // In a real app, this would call an API
    // console.log('Delete checkpoint:', checkpoint.id)
    // Remove from mock data or make API call
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {canUpdate && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className='text-destructive'
            >
              <Trash className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CheckpointDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        checkpoint={checkpoint}
        onSave={handleEdit}
        mode='edit'
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title='Delete Checkpoint'
        desc={`Are you sure you want to delete "${checkpoint.name}"? This action cannot be undone.`}
        handleConfirm={handleDelete}
        destructive
      />
    </>
  )
}