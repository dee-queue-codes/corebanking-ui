import { useState, useRef, useEffect } from 'react'
import { Plus, CreditCard, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/ui/back-button'
import { ROUTES } from '@/router/routes'

const mockPrepaidProducts = [
  { id: '1', name: 'Basic Prepaid Account',   shortName: 'BPA', description: 'Basic prepaid account for everyday transactions',   currency: 'GHS', status: 'Active', minBalance: 10,  maxBalance: 5000  },
  { id: '2', name: 'Premium Prepaid Account', shortName: 'PPA', description: 'Premium prepaid account with enhanced benefits',    currency: 'GHS', status: 'Active', minBalance: 50,  maxBalance: 10000 },
]

export default function PrepaidProductsListPage() {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

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

  const filtered = mockPrepaidProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <BackButton onClick={() => navigate(ROUTES.PRODUCTS.LIST)} label="Back to Products" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl mb-1">Prepaid Products</h1>
          <p className="text-xs text-gray-500">Manage prepaid card and account products</p>
        </div>
        <Button className="text-xs text-white" style={{ backgroundColor: '#002663' }} onClick={() => navigate(ROUTES.PRODUCTS.PREPAID_NEW)}>
          <Plus className="w-4 h-4 mr-2" />Create Prepaid Product
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search prepaid products..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(product => (
            <Card key={product.id} className="p-5 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <span className="text-xs text-gray-400">({product.shortName})</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{product.description}</p>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-gray-500">Currency: <span className="text-gray-900">{product.currency}</span></span>
                      <span className="text-gray-500">Min Balance: <span className="text-gray-900">{product.currency} {product.minBalance}</span></span>
                      <span className="text-gray-500">Max Balance: <span className="text-gray-900">{product.currency} {product.maxBalance}</span></span>
                      <StatusBadge status={product.status} />
                    </div>
                  </div>
                </div>
                <div className="relative" ref={el => { menuRefs.current[product.id] = el }}>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}>
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenuId === product.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setOpenMenuId(null)}><Eye className="w-3.5 h-3.5" />View</button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setOpenMenuId(null)}><Edit className="w-3.5 h-3.5" />Edit</button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => setOpenMenuId(null)}><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No prepaid products yet</h3>
          <p className="text-xs text-gray-500 mb-4">Get started by creating your first prepaid product</p>
          <Button className="text-white text-xs" style={{ backgroundColor: '#002663' }} onClick={() => navigate(ROUTES.PRODUCTS.PREPAID_NEW)}>
            <Plus className="w-4 h-4 mr-2" />Create Prepaid Product
          </Button>
        </div>
      )}
    </div>
  )
}
