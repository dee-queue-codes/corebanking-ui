import type { Status } from './common.types'

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: Status
  createdAt: string
  clientNumber: string
}

export interface ClientAddress {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface ClientFamily {
  spouseName?: string
  numberOfDependents?: number
}

export interface ClientIdentity {
  type: string
  number: string
  issuedBy: string
  expiryDate?: string
}
