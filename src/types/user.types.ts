import type { Status } from './common.types'

export interface SystemUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  status: Status
  createdAt: string
  officeId?: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}
