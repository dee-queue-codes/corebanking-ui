import { useState, useRef, useEffect } from 'react'
import { Plus, PiggyBank, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BackButton } from '@/components/ui/back-button'
import { ROUTES } from '@/router/routes'
import { productsAPI, type SavingsProduct } from '@/services/products/productsAPI'

function extractProductData<T>(response: unknown): T[] {
  if (response && typeof response === 'object' && Array.isArray((response as Record<string, unknown>).data)) {
    return (response as Record<string, unknown>).data as T[]
  }
  return Array.isArray(response) ? response as T[] : []
}

export default function SavingsProductsListPage() {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<SavingsProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setLoading(true)
    setError('')
    productsAPI
      .getSavings()
      .then(res => setProducts(extractProductData<SavingsProduct>(res.data)))
      .catch(() => setError('Could not load savings products.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenuId) {
        const ref = menuRefs.current[openMenuId]
        if (ref && !ref.contains(e.target as Node)) setOpenMenuId(null)
      }
    }
    if (openMenuId) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <BackButton onClick={() => navigate(ROUTES.PRODUCTS.LIST)} label="Back to Products" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl mb-1">Savings Products</h1>
          <p className="text-xs text-gray-500">Manage savings account products and configurations</p>
        </div>
        <Button className="text-xs text-white" style={{ backgroundColor: '#002663' }}>
          <Plus className="w-4 h-4 mr-2" />Create Savings Product
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search savings products..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading savings products...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(product => (
            <Card
              key={product.id}
              className="p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <PiggyBank className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <span className="text-xs text-gray-400">({product.shortName || '-'})</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{product.description || 'Savings product'}</p>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-gray-500">Currency: <span className="text-gray-900">{product.currency}</span></span>
                      <span className="text-gray-500">Min Balance: <span className="text-gray-900">{product.currency} {product.minRequiredBalance ?? 0}</span></span>
                      <span className="text-gray-500">Interest: <span className="text-gray-900">{product.interestRate ?? 0}%</span></span>
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">Active</span>
                    </div>
                  </div>
                </div>
                <div className="relative" ref={el => { menuRefs.current[String(product.id)] = el }}>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={e => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === String(product.id) ? null : String(product.id))
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenuId === String(product.id) && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedProduct(product)
                          setOpenMenuId(null)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={e => { e.stopPropagation(); setOpenMenuId(null) }}><Edit className="w-3.5 h-3.5" />Edit</button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={e => { e.stopPropagation(); setOpenMenuId(null) }}><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No savings products yet</h3>
          <p className="text-xs text-gray-500 mb-4">Get started by creating your first savings product</p>
          <Button className="text-white text-xs" style={{ backgroundColor: '#002663' }}>
            <Plus className="w-4 h-4 mr-2" />Create Savings Product
          </Button>
        </div>
      )}

      <Dialog open={selectedProduct !== null} onOpenChange={open => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          {selectedProduct && (
            <>
              <div className="border-b border-gray-200 bg-[#F5F8FE] px-6 py-5">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50">
                      <PiggyBank className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-base text-gray-950">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="mt-1">
                        {selectedProduct.shortName || 'Savings product'} · {selectedProduct.currency}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              <div className="px-6 py-5">
                <div className="mb-5 flex items-end justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Interest Rate</p>
                    <p className="mt-1 font-sora text-2xl font-semibold text-green-700">{selectedProduct.interestRate ?? 0}%</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700">
                    {selectedProduct.allowOverdraft ? 'Overdraft Allowed' : 'No Overdraft'}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {[
                    ['Currency', selectedProduct.currency],
                    ['Minimum Required Balance', `${selectedProduct.currency} ${selectedProduct.minRequiredBalance ?? 0}`],
                    ['Short Name', selectedProduct.shortName || '-'],
                    ['Allow Overdraft', selectedProduct.allowOverdraft ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-gray-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
