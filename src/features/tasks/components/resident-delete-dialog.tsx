import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Task } from '../data/schema'

interface ResidentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resident: Task | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function ResidentDeleteDialog({ open, onOpenChange, resident, onConfirm, isLoading }: ResidentDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Resident</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the resident for house <strong>{resident?.houseNo}</strong>?
            This action cannot be undone and will remove all associated data including owners and vehicle information.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}