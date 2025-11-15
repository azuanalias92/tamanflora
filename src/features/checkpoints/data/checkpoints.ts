import type { Checkpoint } from './schema'

export const mockCheckpoints: Checkpoint[] = [
  {
    id: '1',
    name: 'Main Entrance',
    latitude: 3.1390,
    longitude: 101.6869,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Visitor Center',
    latitude: 3.1400,
    longitude: 101.6875,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Garden Viewpoint',
    latitude: 3.1385,
    longitude: 101.6870,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
]