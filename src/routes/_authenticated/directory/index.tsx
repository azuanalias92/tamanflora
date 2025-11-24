import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/features/directory'
import { houseTypes } from '@/features/directory/data/data'

const taskSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  houseType: z
    .array(z.enum(houseTypes.map((h) => h.value)))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/directory/')({
  validateSearch: taskSearchSchema,
  component: Tasks,
})
