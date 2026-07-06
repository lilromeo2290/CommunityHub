'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, User, FileEdit, Trash2, CheckCircle2, LogIn, Plus,
  Filter, Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ROLE_LABELS, formatRelative, classNames } from '@/lib/cms'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  createdAt: string
  user: { name: string; role: string } | null
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="size-3.5" />,
  update: <FileEdit className="size-3.5" />,
  delete: <Trash2 className="size-3.5" />,
  approve: <CheckCircle2 className="size-3.5" />,
  login: <LogIn className="size-3.5" />,
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-cyan-100 text-cyan-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-violet-100 text-violet-700',
  login: 'bg-amber-100 text-amber-700',
}

export function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase())
    const matchAction = !actionFilter || actionFilter === 'all' || l.action === actionFilter
    return matchSearch && matchAction
  })

  // Stats
  const byAction = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Role-based access matrix
  const roles = [
    { role: 'admin', label: 'System Administrator', permissions: ['Full system access', 'Manage users & roles', 'Audit logs', 'Configure settings'], color: 'bg-red-100 text-red-700 border-red-200' },
    { role: 'leader', label: 'Community Leader', permissions: ['Approve allocations', 'Post announcements', 'View all reports', 'Manage members'], color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { role: 'project_manager', label: 'Project Manager', permissions: ['Create/edit projects', 'Update milestones', 'Submit allocations', 'View financials'], color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { role: 'finance', label: 'Finance Officer', permissions: ['Record transactions', 'Generate reports', 'View budgets', 'Export data'], color: 'bg-violet-100 text-violet-700 border-violet-200' },
    { role: 'volunteer', label: 'Volunteer', permissions: ['View projects', 'Submit feedback', 'Update contributions', 'Limited editing'], color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { role: 'member', label: 'Community Member', permissions: ['View dashboard', 'Submit feedback', 'View announcements', 'Edit own profile'], color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ]

  return (
    <div className="space-y-5">
      {/* Security header */}
      <Card className="border-emerald-200">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <ShieldCheck className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Security & Audit Trail</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All changes are logged with user, timestamp, and details. Data privacy protected with role-based access control.
            </p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Secured
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Actions" value={logs.length} color="emerald" />
        <StatCard label="Creates" value={byAction.create || 0} color="emerald" />
        <StatCard label="Updates" value={byAction.update || 0} color="cyan" />
        <StatCard label="Approvals" value={byAction.approve || 0} color="violet" />
        <StatCard label="Logins" value={byAction.login || 0} color="amber" />
      </div>

      {/* Role access matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role-Based Access Control</CardTitle>
          <CardDescription className="text-xs">Six-tier permission system ensures data privacy and operational security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map(r => (
              <div key={r.role} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={classNames('flex size-7 items-center justify-center rounded-md', r.color)}>
                    <User className="size-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="text-[10px] text-muted-foreground">{ROLE_LABELS[r.role]}</div>
                  </div>
                </div>
                <ul className="space-y-1">
                  {r.permissions.map(p => (
                    <li key={p} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle2 className="size-3 mt-0.5 text-emerald-600 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Activity Audit Log</CardTitle>
              <CardDescription className="text-xs">Complete history of system changes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 w-40 sm:w-56 text-xs"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filtered.map((log, i) => {
                const initials = (log.user?.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.5) }}
                    className="p-3 flex items-center gap-3 hover:bg-muted/30"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{log.user?.name || 'System'}</span>
                        <Badge variant="outline" className={classNames(
                          'text-[10px] capitalize',
                          ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                        )}>
                          {ACTION_ICONS[log.action]}
                          {log.action}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          on {log.entity}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {log.details || `Performed ${log.action} on ${log.entity}`}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatRelative(log.createdAt)}
                    </span>
                  </motion.div>
                )
              })}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No matching audit logs found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'emerald' | 'cyan' | 'violet' | 'amber' }) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  }
  return (
    <Card>
      <CardContent className="p-3">
        <div className={classNames('inline-flex size-7 items-center justify-center rounded-md mb-1.5', colorMap[color])}>
          <ShieldCheck className="size-3.5" />
        </div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
