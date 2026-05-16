export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export type Status = 'active' | 'inactive' | 'pending' | 'suspended'
