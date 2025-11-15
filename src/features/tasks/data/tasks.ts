import { faker } from '@faker-js/faker'

faker.seed(12345)

export const tasks = Array.from({ length: 60 }, (_, i) => {
  const houseNo = String(faker.number.int({ min: 1, max: 300 }))
  const ownersCount = faker.number.int({ min: 1, max: 3 })
  const vehiclesCount = faker.number.int({ min: 0, max: 3 })
  const owners = Array.from({ length: ownersCount }, () => ({
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    userId: faker.helpers.maybe(() => `USER-${faker.number.int({ min: 100, max: 999 })}`, { probability: 0.3 }) || undefined,
  }))
  const vehicles = Array.from({ length: vehiclesCount }, () => ({
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    plate: faker.vehicle.vrm(),
  }))
  const houseType = faker.helpers.arrayElement(['own', 'homestay'] as const)

  return {
    id: `HOUSE-${i + 1}-${houseNo}`,
    houseNo,
    owners,
    vehicles,
    houseType,
  }
})
