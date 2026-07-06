'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  UserPlus, Search, Pencil, Trash2, Shield, Mail, AlertTriangle,
  CheckCircle2, XCircle, Users as UsersIcon, Crown, Briefcase,
  HeartHandshake, User as UserIcon, Wallet, ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import { classNames, ROLE_LABELS } from '@/lib/cms'
import { toast } from 'sonner'

interface UserAccount {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  active: boolean
  createdAt: string
  member: { id: string; fullName: string; category: string; phone: string | null } | null
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  admin: { label: 'Administrator', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900', icon: <Crown className="size-3.5" />, description: 'Full system access including user management, settings, and audit logs' },
  leader: { label: 'Community Leader', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900', icon: <ShieldCheck className="size-3.5" />, description: 'Approve allocations, post announcements, manage members, view all reports' },
  project_manager: { label: 'Project Manager', color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-900', icon: <Briefcase className="size-3.5" />, description: 'Create and edit projects, update milestones, submit allocations, view financials' },
  finance: { label: 'Finance Officer', color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900', icon: <Wallet className="size-3.5" />, description: 'Record transactions, generate reports, view budgets, export data' },
  volunteer: { label: 'Volunteer', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900', icon: <HeartHandshake className="size-3.5" />, description: 'View projects, submit feedback, update contributions, limited editing' },
  member: { label: 'Community Member', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700', icon: <UserIcon className="size-3.5" />, description: 'View dashboard, submit feedback, view announcements, edit own profile' },
}

// Permissions matrix — which actions each role can perform
const PERMISSIONS: { category: string; actions: { label: string; roles: string[] }[] }[] = [
  {
    category: 'Members',
    actions: [
      { label: 'View member list', roles: ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member'] },
      { label: 'Add / edit members', roles: ['admin', 'leader', 'project_manager'] },
      { label: 'Delete members', roles: ['admin', 'leader'] },
    ],
  },
  {
    category: 'Resources',
    actions: [
      { label: 'View inventory', roles: ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member'] },
      { label: 'Request allocations', roles: ['admin', 'leader', 'project_manager', 'volunteer'] },
      { label: 'Approve / reject allocations', roles: ['admin', 'leader'] },
      { label: 'Add / edit resources', roles: ['admin', 'leader', 'project_manager'] },
    ],
  },
  {
    category: 'Projects',
    actions: [
      { label: 'View projects', roles: ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member'] },
      { label: 'Create / edit projects', roles: ['admin', 'leader', 'project_manager'] },
      { label: 'Update milestones & status', roles: ['admin', 'leader', 'project_manager'] },
      { label: 'Delete projects', roles: ['admin'] },
    ],
  },
  {
    category: 'Finance',
    actions: [
      { label: 'View financial summary', roles: ['admin', 'leader', 'finance'] },
      { label: 'Record transactions', roles: ['admin', 'finance'] },
      { label: 'Approve large expenses', roles: ['admin', 'leader'] },
      { label: 'Export financial reports', roles: ['admin', 'finance'] },
    ],
  },
  {
    category: 'Communication',
    actions: [
      { label: 'View announcements', roles: ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member'] },
      { label: 'Post announcements', roles: ['admin', 'leader'] },
      { label: 'Pin / delete announcements', roles: ['admin', 'leader'] },
    ],
  },
  {
    category: 'Settings & Security',
    actions: [
      { label: 'Manage categories', roles: ['admin'] },
      { label: 'Manage users & roles', roles: ['admin'] },
      { label: 'View audit logs', roles: ['admin', 'leader'] },
      { label: 'Configure system settings', roles: ['admin'] },
    ],
  },
]

export function UserManagementView() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [tab, setTab] = useState('users')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<UserAccount | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<UserAccount | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)
    fetch(`/api/users?${params}`)
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .finally(() => setLoading(false))
  }, [search, roleFilter])

  useEffect(() => {
    const t = setTimeout(refresh, 250)
    return () => clearTimeout(t)
  }, [refresh, refreshKey])

  const handleToggleActive = async (user: UserAccount) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${user.name} ${user.active ? 'deactivated' : 'activated'}`)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/users?id=${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success(`${deleting.name} deleted`)
      setDeleting(null)
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete user')
    }
  }

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.active).length
  const adminCount = users.filter(u => u.role === 'admin' && u.active).length
  const leaderCount = users.filter(u => u.role === 'leader' && u.active).length
  const volunteerCount = users.filter(u => u.role === 'volunteer' && u.active).length

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <Card className="border-emerald-200 dark:border-emerald-900/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Shield className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Users & Roles</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage user accounts, assign roles, and review permissions. Changes are logged in the audit trail.
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreating(true)}>
            <UserPlus className="size-4 mr-2" />
            Add User
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={totalUsers} icon={<UsersIcon className="size-4" />} color="emerald" />
        <StatCard label="Active" value={activeUsers} icon={<CheckCircle2 className="size-4" />} color="cyan" />
        <StatCard label="Admins" value={adminCount} icon={<Crown className="size-4" />} color="red" />
        <StatCard label="Volunteers" value={volunteerCount} icon={<HeartHandshake className="size-4" />} color="amber" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No users found. Try adjusting filters or add a new user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Linked Member</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Joined</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u, i) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.02, 0.5) }}
                          className="hover:bg-muted/30"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback className={classNames(
                                  'text-xs',
                                  u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : u.role === 'leader' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-muted'
                                )}>
                                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{u.name}</div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                  <Mail className="size-3" />
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={classNames('text-[10px] gap-1', ROLE_CONFIG[u.role]?.color)}>
                              {ROLE_CONFIG[u.role]?.icon}
                              {ROLE_CONFIG[u.role]?.label || u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {u.member ? (
                              <div className="text-xs">
                                <div className="font-medium">{u.member.fullName}</div>
                                <div className="text-muted-foreground capitalize">{u.member.category}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={u.active}
                                onCheckedChange={() => handleToggleActive(u)}
                                className="scale-90"
                                disabled={u.role === 'admin' && adminCount <= 1}
                              />
                              <span className={classNames('text-[11px]', u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                                {u.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs hidden lg:table-cell text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setEditing(u)}
                                title="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                onClick={() => setDeleting(u)}
                                disabled={u.role === 'admin' && adminCount <= 1}
                                title={u.role === 'admin' && adminCount <= 1 ? 'Cannot delete last admin' : 'Delete'}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          {/* Role cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
              const count = users.filter(u => u.role === key && u.active).length
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={classNames('flex size-7 items-center justify-center rounded-md', cfg.color)}>
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{cfg.label}</div>
                        <div className="text-[10px] text-muted-foreground">{count} active {count === 1 ? 'user' : 'users'}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{cfg.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Permissions matrix */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="size-4" />
                Permissions Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                What each role can do across the platform. Last-admin protection prevents accidental lockout.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs min-w-[200px]">Action</TableHead>
                      {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                        <TableHead key={key} className="text-xs text-center min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <div className={classNames('flex size-6 items-center justify-center rounded', cfg.color)}>
                              {cfg.icon}
                            </div>
                            <span className="text-[10px] leading-tight">{cfg.label.split(' ')[0]}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSIONS.map(group => (
                      <>
                        <TableRow key={group.category} className="bg-muted/30">
                          <TableCell colSpan={7} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-2">
                            {group.category}
                          </TableCell>
                        </TableRow>
                        {group.actions.map(action => (
                          <TableRow key={action.label}>
                            <TableCell className="text-xs py-2">{action.label}</TableCell>
                            {Object.keys(ROLE_CONFIG).map(role => (
                              <TableCell key={role} className="text-center py-2">
                                {action.roles.includes(role) ? (
                                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 inline" />
                                ) : (
                                  <XCircle className="size-4 text-muted-foreground/40 inline" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <UserDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => { setCreating(false); setRefreshKey(k => k + 1) }}
      />

      {/* Edit dialog */}
      <UserDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        user={editing}
        onSaved={() => { setEditing(null); setRefreshKey(k => k + 1) }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Delete user account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <strong>{deleting?.name}</strong> ({deleting?.email}).
              This will remove their ability to log in. Their audit log entries will be retained but marked as &quot;System&quot;.
              {deleting?.member && (
                <span className="block mt-2 text-amber-700 dark:text-amber-400">
                  ⚠️ This user has a linked member profile ({deleting.member.fullName}). You must reassign or delete that member profile first.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDialog({
  open, onOpenChange, user, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user?: UserAccount | null
  onSaved: () => void
}) {
  const isEdit = !!user
  const [form, setForm] = useState({
    name: '', email: '', role: 'member', active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'member',
        active: user?.active ?? true,
      })
    }
  }, [open, user])

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSaving(true)
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit ? { id: user!.id, ...form } : form
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success(isEdit ? 'User updated' : 'User created')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <CardDescription className="text-xs">
            {isEdit
              ? 'Update name, email, role, or active status. Changes take effect immediately.'
              : 'Create a new user account. The user will appear in the users list and audit logs.'}
          </CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="e.g. John Doe" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="e.g. john@cms.org" />
            {isEdit && <p className="text-[10px] text-muted-foreground mt-1">Email is used as the login identifier.</p>}
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {ROLE_CONFIG[form.role]?.description}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              id="user-active"
            />
            <Label htmlFor="user-active" className="text-xs cursor-pointer">
              Active (can log in)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  label, value, icon, color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'emerald' | 'cyan' | 'red' | 'amber'
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  }
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={classNames('flex size-8 items-center justify-center rounded-md', colorMap[color])}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold leading-tight">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
