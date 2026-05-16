import type { Status } from './common.types'

export type ProductCategory = 'prepaid' | 'loan' | 'savings'

export interface Product {
  id: string
  name: string
  code: string
  category: ProductCategory
  currency: string
  status: Status
  description?: string
}

export interface PrepaidProduct extends Product {
  category: 'prepaid'
  minimumBalance: number
  maximumBalance: number
}
