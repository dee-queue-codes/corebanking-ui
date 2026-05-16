import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { mockProductService } from '@/services/mock/mockServices'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockProductService.getAll().then(({ data }) => {
      setProducts(data.content)
      setLoading(false)
    })
  }, [])

  return { products, loading }
}
