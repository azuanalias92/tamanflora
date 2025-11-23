import { createFileRoute } from '@tanstack/react-router'
import { CheckInSettings } from '@/features/settings/check-in-settings'

export const Route = createFileRoute('/_authenticated/settings/check-in')({
  component: CheckInSettings,
})
