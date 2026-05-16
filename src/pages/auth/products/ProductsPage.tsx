import { useState, useRef, useEffect } from 'react'
import {
  DollarSign, PiggyBank, Share2, Receipt, Shield, Layers, PieChart,
  Building2, Calendar, FileText, TrendingUp, CreditCard, Search, Filter, ChevronDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ROUTES } from '@/router/routes'

interface Product {
  id: string
  name: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  color: string
  bgColor: string
}

const allProducts: Product[] = [
  { id: 'prepaid-products',             name: 'Prepaid Products',             description: 'Manage prepaid card and account products',     icon: CreditCard,   color: 'text-violet-600', bgColor: 'bg-violet-50'  },
  { id: 'loan-products',                name: 'Loan Products',                description: 'Manage loan products and configurations',       icon: DollarSign,   color: 'text-blue-600',   bgColor: 'bg-blue-50'    },
  { id: 'savings-products',             name: 'Savings Products',             description: 'Configure savings account products',            icon: PiggyBank,    color: 'text-green-600',  bgColor: 'bg-green-50'   },
  { id: 'share-products',               name: 'Share Products',               description: 'Manage share and equity products',              icon: Share2,       color: 'text-purple-600', bgColor: 'bg-purple-50'  },
  { id: 'charges',                      name: 'Charges',                      description: 'Define and manage product charges',             icon: Receipt,      color: 'text-orange-600', bgColor: 'bg-orange-50'  },
  { id: 'collateral-management',        name: 'Collateral Management',        description: 'Manage collateral types and valuations',        icon: Shield,       color: 'text-indigo-600', bgColor: 'bg-indigo-50'  },
  { id: 'delinquency-buckets',          name: 'Delinquency Buckets',          description: 'Configure delinquency aging buckets',           icon: Layers,       color: 'text-red-600',    bgColor: 'bg-red-50'     },
  { id: 'products-mix',                 name: 'Products Mix',                 description: 'View and analyze product mix',                  icon: PieChart,     color: 'text-pink-600',   bgColor: 'bg-pink-50'    },
  { id: 'fixed-deposit-products',       name: 'Fixed Deposit Products',       description: 'Manage fixed deposit products',                 icon: Building2,    color: 'text-teal-600',   bgColor: 'bg-teal-50'    },
  { id: 'recurring-deposit-products',   name: 'Recurring Deposit Products',   description: 'Configure recurring deposit products',          icon: Calendar,     color: 'text-cyan-600',   bgColor: 'bg-cyan-50'    },
  { id: 'tax-configurations',           name: 'Manage Tax Configurations',    description: 'Set up tax rules and configurations',           icon: FileText,     color: 'text-amber-600',  bgColor: 'bg-amber-50'   },
  { id: 'floating-rates',               name: 'Floating Rates',               description: 'Manage floating interest rates',                icon: TrendingUp,   color: 'text-emerald-600',bgColor: 'bg-emerald-50' },
]

const enabledProductIds = new Set(['prepaid-products', 'loan-products', 'savings-products'])

const routeMap: Record<string, string> = {
  'prepaid-products':  ROUTES.PRODUCTS.PREPAID,
  'loan-products':     ROUTES.PRODUCTS.LOAN,
  'savings-products':  ROUTES.PRODUCTS.SAVINGS,
}

const categories = ['all', 'Deposit Products', 'Loan Products', 'Configuration', 'Management'] as const
type Category = (typeof categories)[number]

function matchesCategory(id: string, cat: Category) {
  if (cat === 'all') return true
  if (cat === 'Deposit Products') return ['savings-products','fixed-deposit-products','recurring-deposit-products','prepaid-products'].includes(id)
  if (cat === 'Loan Products') return id === 'loan-products'
  if (cat === 'Configuration') return ['charges','tax-configurations','floating-rates'].includes(id)
  if (cat === 'Management') return ['collateral-management','delinquency-buckets','products-mix','share-products'].includes(id)
  return true
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  const filteredProducts = allProducts.filter(p => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    return matchesSearch && matchesCategory(p.id, selectedCategory)
  })

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 font-semibold text-xl mb-1">Products</h1>
        <p className="text-xs text-gray-500">Manage banking products and services</p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <Button variant="outline" className="text-xs bg-white border-gray-300" onClick={() => setFilterOpen(v => !v)}>
            <Filter className="w-4 h-4 mr-2" />
            {selectedCategory === 'all' ? 'Filter' : selectedCategory}
            <ChevronDown className={`w-3 h-3 ml-2 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </Button>
          {filterOpen && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 w-52">
              <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">Filter by category</div>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setFilterOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedCategory === cat ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => {
          const Icon = product.icon
          const isDisabled = !enabledProductIds.has(product.id)
          return (
            <Card
              key={product.id}
              className={`p-5 transition-shadow bg-white ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer group'}`}
              onClick={() => { if (!isDisabled) navigate(routeMap[product.id]) }}
            >
              <div className={`w-12 h-12 rounded-lg ${product.bgColor} flex items-center justify-center mb-3 ${!isDisabled ? 'group-hover:scale-110' : ''} transition-transform`}>
                <Icon className={`w-6 h-6 ${product.color}`} />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500">{product.description}</p>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-xs text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
