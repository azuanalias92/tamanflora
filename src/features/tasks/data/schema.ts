import { z } from 'zod'

const vehicleSchema = z.object({
  brand: z.string(),
  model: z.string(),
  plate: z.string(),
})

const ownerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  userId: z.string().optional(),
})

export const residentSchema = z.object({
  id: z.string(),
  houseNo: z.string(),
  owners: z.array(ownerSchema).min(1),
  vehicles: z.array(vehicleSchema).default([]),
  houseType: z.enum(['own', 'homestay']),
})

export type Task = z.infer<typeof residentSchema>
