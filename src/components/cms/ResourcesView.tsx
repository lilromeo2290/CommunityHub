'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package, Plus, AlertTriangle, CheckCircle2, Clock, XCircle, ArrowRight,
  Boxes, Wallet, Pill, Wrench, BookOpen, HandHeart, FileText,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import { formatRelative, classNames, STATUS_COLORS } from '@/lib/cms'
import { useCategories } from '@/hooks/use-categories'
import { toast } from 'sonner'

interface Resource {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  reserved: number
  available: number
  threshold: number
  utilization: number
  status: 'ok' | 'low' | 'out'
  location: string | null
  description: string | null
  allocations: any[]
}

interface Allocation {
  id: string
  resourceId: string
  quantity: number
  reason: string
  status: string
  createdAt: string
  approvedAt: string | null
  resource: { name: string; unit: string }
  project: { name: string } | null
  approver: { name: string } | null
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fund: <Wallet className="size-4" />,
  food: <Boxes className="size-4" />,
  medicine: <Pill className="size-4" />,
  equipment: <Wrench className="size-4" />,
  material: <Package className="size-4" />,
  human: <HandHeart className="size-4" />,
}

export function ResourcesView() {
  const [resources, setResources] = useState<Resource[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [tab, setTab] = useState('inventory')

  const refresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/resources').then(r => r.json()),
      fetch('/api/allocations').then(r => r.json()),
    ]).then(([r, a]) => {
      setResources(r.resources || [])
      setAllocations(a.allocations || [])
    }).finally(() => setLoading(false))
  }, [refreshKey])

  const pendingAllocations = allocations.filter(a => a.status === 'pending')

  const handleAllocationAction = async (id: string, action: 'approve' | 'reject' | 'distribute') => {
    try {
      const res = await fetch('/api/allocations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Allocation ${action}${action === 'distribute' ? 'd' : 'ed'} successfully`)
      refresh()
    } catch {
      toast.error(`Failed to ${action} allocation`)
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Total Resources"
          value={resources.length.toString()}
          icon={<Package className="size-4" />}
          color="emerald"
        />
        <StatTile
          label="Low Stock"
          value={resources.filter(r => r.status === 'low').length.toString()}
          icon={<AlertTriangle className="size-4" />}
          color="amber"
        />
        <StatTile
          label="Out of Stock"
          value={resources.filter(r => r.status === 'out').length.toString()}
          icon={<XCircle className="size-4" />}
          color="red"
        />
        <StatTile
          label="Pending Approvals"
          value={pendingAllocations.length.toString()}
          icon={<Clock className="size-4" />}
          color="cyan"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="allocations">
            Allocations
            {pendingAllocations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-100 text-amber-700">
                {pendingAllocations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Inventory */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Resource Inventory</h3>
              <p className="text-xs text-muted-foreground">Track all available resources, stock levels, and locations.</p>
            </div>
            <AddResourceDialog onCreated={refresh} />
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <ResourceCard resource={r} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Allocations */}
        <TabsContent value="allocations" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Resource Allocations</h3>
              <p className="text-xs text-muted-foreground">Approval workflow for resource distribution requests.</p>
            </div>
            <RequestAllocationDialog resources={resources} onCreated={refresh} />
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {allocations.map(a => (
                    <AllocationRow
                      key={a.id}
                      allocation={a}
                      onAction={handleAllocationAction}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" /> Resource Utilization Report
              </CardTitle>
              <CardDescription className="text-xs">
                Reserved vs Available quantities across all resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={resources.filter(r => r.category !== 'fund').map(r => ({
                    name: r.name.length > 18 ? r.name.slice(0, 18) + '...' : r.name,
                    available: r.available,
                    reserved: r.reserved,
                    threshold: r.threshold,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="available" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="reserved" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" /> Reserved
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shortage Risk Analysis</CardTitle>
              <CardDescription className="text-xs">Resources below or near threshold</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.filter(r => r.status !== 'ok').map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={classNames(
                      'flex size-8 items-center justify-center rounded-md',
                      r.status === 'out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    )}>
                      {CATEGORY_ICONS[r.category]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.available} of {r.quantity} {r.unit} available (threshold: {r.threshold})
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={classNames(
                    'text-[10px]',
                    r.status === 'out' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}>
                    {r.status === 'out' ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </Badge>
                </div>
              ))}
              {resources.filter(r => r.status !== 'ok').length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
                  All resources above threshold. No shortage risks.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const statusColor = resource.status === 'out' ? 'red' : resource.status === 'low' ? 'amber' : 'emerald'
  const statusBg = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={classNames(
              'flex size-9 items-center justify-center rounded-md',
              resource.status === 'out' ? 'bg-red-100 text-red-600'
                : resource.status === 'low' ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            )}>
              {CATEGORY_ICONS[resource.category] || <Package className="size-4" />}
            </div>
            <div>
              <div className="text-sm font-semibold">{resource.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{resource.category}</div>
            </div>
          </div>
          <Badge variant="outline" className={classNames('text-[10px]', statusBg[statusColor])}>
            {resource.status === 'out' ? 'OUT' : resource.status === 'low' ? 'LOW' : 'OK'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Available</span>
            <span className="text-lg font-bold">
              {resource.available}
              <span className="text-xs text-muted-foreground ml-1">{resource.unit}</span>
            </span>
          </div>
          <Progress value={resource.utilization} className="h-1.5" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{resource.utilization}% reserved</span>
            <span>Threshold: {resource.threshold}</span>
          </div>
        </div>

        {resource.location && (
          <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground">
            Location: {resource.location}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AllocationRow({
  allocation, onAction,
}: {
  allocation: Allocation
  onAction: (id: string, action: 'approve' | 'reject' | 'distribute') => void
}) {
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={classNames(
          'flex size-9 items-center justify-center rounded-md flex-shrink-0',
          allocation.status === 'pending' ? 'bg-amber-100 text-amber-600'
            : allocation.status === 'approved' ? 'bg-emerald-100 text-emerald-600'
            : allocation.status === 'rejected' ? 'bg-red-100 text-red-600'
            : 'bg-cyan-100 text-cyan-600'
        )}>
          {allocation.status === 'pending' ? <Clock className="size-4" />
            : allocation.status === 'approved' ? <CheckCircle2 className="size-4" />
            : allocation.status === 'rejected' ? <XCircle className="size-4" />
            : <ArrowRight className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">
                {allocation.quantity} {allocation.resource.unit} of {allocation.resource.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{allocation.reason}</div>
              {allocation.project && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  For: <span className="font-medium">{allocation.project.name}</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className={classNames('text-[10px] capitalize', STATUS_COLORS[allocation.status])}>
              {allocation.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-muted-foreground">
              Requested {formatRelative(allocation.createdAt)}
              {allocation.approver && ` · by ${allocation.approver.name}`}
            </div>
            {allocation.status === 'pending' && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => onAction(allocation.id, 'reject')}>
                  Reject
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction(allocation.id, 'approve')}>
                  Approve
                </Button>
              </div>
            )}
            {allocation.status === 'approved' && (
              <Button size="sm" className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => onAction(allocation.id, 'distribute')}>
                Mark Distributed
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddResourceDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const { categories } = useCategories('resource')
  const [form, setForm] = useState({
    name: '', category: 'food', unit: 'unit', quantity: '', threshold: '',
    location: '', description: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('Resource name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Resource added successfully')
      setOpen(false)
      onCreated()
      setForm({ name: '', category: 'food', unit: 'unit', quantity: '', threshold: '', location: '', description: '' })
    } catch {
      toast.error('Failed to add resource')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <CardDescription className="text-xs">Register a new resource in the community inventory.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="e.g. Rice" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="food">Food</SelectItem>
                  ) : (
                    categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Threshold (alert)</Label>
              <Input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : 'Add Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RequestAllocationDialog({ resources, onCreated }: { resources: Resource[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ resourceId: '', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.resourceId || !form.quantity || !form.reason) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Allocation request submitted')
      setOpen(false)
      onCreated()
      setForm({ resourceId: '', quantity: '', reason: '' })
    } catch {
      toast.error('Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4 mr-2" />
          Request Allocation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Resource Allocation</DialogTitle>
          <CardDescription className="text-xs">
            Submit a request for resource distribution. Approval required from a community leader.
          </CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Resource *</Label>
            <Select value={form.resourceId} onValueChange={v => setForm({ ...form, resourceId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select resource" /></SelectTrigger>
              <SelectContent>
                {resources.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.available} {r.unit} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quantity *</Label>
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Reason / Purpose *</Label>
            <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="mt-1" rows={3} placeholder="Explain how this resource will be used..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatTile({
  label, value, icon, color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'emerald' | 'amber' | 'red' | 'cyan'
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    cyan: 'bg-cyan-100 text-cyan-600',
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
