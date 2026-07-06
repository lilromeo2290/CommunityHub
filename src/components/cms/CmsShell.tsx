'use client'

import { useState, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import {
  Menu,
  X,
  Bell,
  Search,
  Globe,
  Wifi,
  Cloud,
  LayoutDashboard,
  Users,
  Package,
  Target,
  Wallet,
  ClipboardCheck,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import { NAV_ITEMS, type ViewKey, classNames } from '@/lib/cms'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'

// Browser-only online status via useSyncExternalStore (avoids hydration mismatch)
const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}
const getSnapshot = () => navigator.onLine
const getServerSnapshot = () => true

interface ShellProps {
  activeView: ViewKey
  onViewChange: (v: ViewKey) => void
  alertCount: number
  children: React.ReactNode
}

export function CmsShell({ activeView, onViewChange, alertCount, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [syncing, setSyncing] = useState(false)

  const activeItem = NAV_ITEMS.find(n => n.key === activeView)

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Globe className="size-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-tight">CommunityHub</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Resource & Project Platform</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground w-56 lg:w-64">
              <Search className="size-4" />
              <input
                placeholder="Search members, projects..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] rounded border bg-background px-1.5 py-0.5">⌘K</kbd>
            </div>

            {/* Offline/Sync indicator */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex gap-2 text-muted-foreground"
              onClick={() => {
                setSyncing(true)
                setTimeout(() => setSyncing(false), 1500)
              }}
              title={online ? 'Online — click to sync' : 'Offline mode — queued changes will sync when online'}
            >
              {online ? (
                <Wifi className="size-4 text-emerald-500" />
              ) : (
                <Cloud className="size-4 text-amber-500" />
              )}
              <span className="text-xs hidden lg:inline">
                {syncing ? 'Syncing...' : online ? 'Online' : 'Offline'}
              </span>
            </Button>

            {/* Theme toggle (Light / Dark / System) */}
            <ThemeToggle />

            {/* Alerts */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Alerts"
              onClick={() => onViewChange('dashboard')}
            >
              <Bell className="size-5" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </Button>

            {/* User */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1 pr-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs">AO</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-medium leading-tight">Amara Okonkwo</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">Administrator</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Amara Okonkwo</span>
                    <span className="text-xs text-muted-foreground">admin@cms.org</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">My Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Help & Documentation</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-60 flex-col border-r bg-background">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className={classNames(
                  'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  activeView === item.key
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <ViewIcon view={item.key} active={activeView === item.key} />
                <div className="flex-1 min-w-0">
                  <div className={classNames(
                    'text-sm font-medium leading-tight',
                    activeView === item.key && 'text-emerald-700 dark:text-emerald-300'
                  )}>{item.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
                </div>
                {item.key === 'resources' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">!</Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t">
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-3 border border-emerald-100 dark:border-emerald-900/50">
              <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">Need help?</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400/80 leading-snug mb-2">
                Check the documentation or contact support for guidance on using CommunityHub.
              </div>
              <Button size="sm" variant="outline" className="w-full h-7 text-xs">View Docs</Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              className="fixed left-0 top-16 bottom-0 z-40 w-72 bg-background border-r lg:hidden overflow-y-auto"
            >
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => {
                      onViewChange(item.key)
                      setMobileOpen(false)
                    }}
                    className={classNames(
                      'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left',
                      activeView === item.key
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'hover:bg-muted'
                    )}
                  >
                    <ViewIcon view={item.key} active={activeView === item.key} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground">{item.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="border-b bg-background px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{activeItem?.label}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{activeItem?.description}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live data · synced just now
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {children}
          </div>

          <footer className="mt-auto border-t bg-background px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <div>© 2026 CommunityHub · Open-source community management platform</div>
              <div className="flex items-center gap-3">
                <span>v2.4.1</span>
                <span>·</span>
                <span>NGO-ready</span>
                <span>·</span>
                <span>Mobile-first</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function ViewIcon({ view, active }: { view: ViewKey; active: boolean }) {
  const iconClass = active ? 'text-emerald-600' : 'text-muted-foreground'
  const cls = `size-4 mt-0.5 ${iconClass}`
  switch (view) {
    case 'dashboard': return <LayoutDashboard className={cls} />
    case 'members': return <Users className={cls} />
    case 'resources': return <Package className={cls} />
    case 'projects': return <Target className={cls} />
    case 'finance': return <Wallet className={cls} />
    case 'evaluation': return <ClipboardCheck className={cls} />
    case 'ai': return <Sparkles className={cls} />
    case 'communication': return <Megaphone className={cls} />
    case 'audit': return <ShieldCheck className={cls} />
    case 'settings': return <Settings className={cls} />
  }
}
