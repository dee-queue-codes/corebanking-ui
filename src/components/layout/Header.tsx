import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ChevronDown, Menu, User, Settings, HelpCircle, Shield, CreditCard, TrendingUp, AlertCircle, LogOut, Bell, Globe, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/router/routes'

interface HeaderProps {
  onMenuToggle?: () => void
  sidebarCollapsed?: boolean
}

const notifications = [
  {
    id: 1,
    icon: CreditCard,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'New transaction alert',
    desc: 'Cash deposit of GHS 5,000 processed',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    icon: TrendingUp,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'KYC verified',
    desc: 'Client KYC verification completed',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: 3,
    icon: AlertCircle,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Scheduled maintenance',
    desc: 'System maintenance at 2:00 AM tonight',
    time: '3 hr ago',
    unread: false,
  },
]

export function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(notifications.filter(n => n.unread).length)
  const [readIds, setReadIds] = useState<number[]>([])

  const currentUser = authService.getCurrentUser()
  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase() || 'CB'
    : 'CB'
  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : 'Administrator'
  const displayEmail = currentUser?.email ?? ''

  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K focuses the search bar
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [handleGlobalKey])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (!q) return
    // If it looks like an account number (all digits), go to account lookup
    if (/^\d{6,}$/.test(q)) {
      navigate(`${ROUTES.CLIENTS.ACCOUNT_LOOKUP}?account=${encodeURIComponent(q)}`)
    } else {
      navigate(`${ROUTES.CLIENTS.LIST}?search=${encodeURIComponent(q)}`)
    }
    searchRef.current?.blur()
  }

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.LOGIN)
  }

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReadIds(notifications.map(n => n.id))
    setUnreadCount(0)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 shadow-sm px-5 flex items-center gap-4 z-10 shrink-0">

      <button
        onClick={onMenuToggle}
        title="Toggle sidebar"
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-200 shrink-0" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search clients, accounts..."
            className="w-full pl-9 pr-16 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
          />
          <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 text-[10px] font-mono select-none">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1.5">

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>EN</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-gray-500">Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2">
              <span>🇬🇧</span> English (UK)
              <Check className="w-3 h-3 ml-auto text-blue-600" />
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2 opacity-40" disabled>
              <span>🇫🇷</span> Français
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2 opacity-40" disabled>
              <span>🇪🇸</span> Español
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-700">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold px-1 shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.map(n => {
                const Icon = n.icon
                const isUnread = !readIds.includes(n.id) && n.unread
                return (
                  <DropdownMenuItem key={n.id} className={`px-4 py-3 cursor-pointer focus:bg-gray-50 ${isUnread ? 'bg-blue-50/40' : ''}`}>
                    <div className="flex items-start gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full ${n.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`h-3.5 w-3.5 ${n.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-gray-800 truncate">{n.title}</p>
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{n.desc}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                View all notifications
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-1 pr-3 h-9 rounded-lg hover:bg-gray-100 transition-all group">
              <div className="relative">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: '#002663', color: 'white' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-gray-700">{displayName}</span>
                <span className="text-[10px] text-gray-400">Administrator</span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-1" sideOffset={8}>
            <div className="px-3 py-2.5 mb-1">
              <p className="text-xs font-semibold text-gray-800">{displayName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{displayEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2.5 py-2 cursor-pointer rounded-md">
              <User className="w-3.5 h-3.5 text-gray-500" /><span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2.5 py-2 cursor-pointer rounded-md">
              <Settings className="w-3.5 h-3.5 text-gray-500" /><span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2.5 py-2 cursor-pointer rounded-md">
              <Shield className="w-3.5 h-3.5 text-gray-500" /><span>Security</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2.5 py-2 cursor-pointer rounded-md">
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" /><span>Help & Support</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 h-9 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md group"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
