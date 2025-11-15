import { createFileRoute } from '@tanstack/react-router'
import { CheckIn } from '@/features/check-in'

export const Route = createFileRoute('/_authenticated/check-in/')({
  component: CheckIn,
})