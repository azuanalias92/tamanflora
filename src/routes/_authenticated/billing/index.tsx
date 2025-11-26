import { createFileRoute } from '@tanstack/react-router'
import { Billing } from '@/features/billing'

type SummaryRow = {
  houseId: string
  houseNo: string
  amountDue: number
  amountPaid: number
  debit: number
  credit: number
  status: string
}

export const Route = createFileRoute('/_authenticated/billing/')({
  component: Billing,
})
