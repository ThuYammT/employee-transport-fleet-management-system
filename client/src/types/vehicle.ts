export type Vehicle = {
  id: number
  plateNumber: string
  vehicleType: string
  capacity: number
  status: string
  currentMileage: number
  createdAt: string
  updatedAt: string
}

export type CreateVehicleData = {
  plateNumber: string
  vehicleType: string
  capacity: number
}

export type UpdateVehicleData = Partial<CreateVehicleData>