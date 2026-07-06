'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Target, Calendar, MapPin, Users, DollarSign, CheckCircle2,
  Circle, Clock, AlertCircle, FileText, TrendingUp, ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency, formatDate, formatRelative, classNames, STATUS_COLORS } from '@/lib/cms'
import { useCategories } from '@/hooks/use-categories'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description: string | null
  category: string
  goal: string | null
  budget: number
  spent: number
  startDate: string
  endDate: string | null
  progress: number
  status: string
  managerName: string | null
  location: string | null
  beneficiaries: number
  milestones: any[]
  feedback: any[]
  allocations: any[]
}

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  health: 'bg-rose-100 text-rose-700 border-rose-200',
  education: 'bg-amber-100 text-amber-700 border-amber-200',
  environment: 'bg-green-100 text-green-700 border-green-200',
  social: 'bg-violet-100 text-violet-700 border-violet-200',
  economic: 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState<Project | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const filtered = tab === 'all' ? projects : projects.filter(p => p.status === tab)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total Projects" value={projects.length.toString()} icon={<Target className="size-4" />} color="emerald" />
        <StatTile label="Active" value={projects.filter(p => p.status === 'active').length.toString()} icon={<TrendingUp className="size-4" />} color="cyan" />
        <StatTile label="Completed" value={projects.filter(p => p.status === 'completed').length.toString()} icon={<CheckCircle2 className="size-4" />} color="emerald" />
        <StatTile label="Delayed" value={projects.filter(p => p.status === 'delayed').length.toString()} icon={<AlertCircle className="size-4" />} color="red" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="delayed">Delayed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <AddProjectDialog onCreated={refresh} />
        </div>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No projects in this category.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ProjectCard project={p} onClick={() => setSelected(p)} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && <ProjectDetail project={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const budgetUsage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0
  const completedMilestones = project.milestones.filter(m => m.completed).length
  const overdueMilestones = project.milestones.filter(m => !m.completed && new Date(m.dueDate) < new Date()).length

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="outline" className={classNames('text-[10px] capitalize', CATEGORY_COLORS[project.category])}>
            {project.category}
          </Badge>
          <Badge variant="outline" className={classNames('text-[10px] capitalize', STATUS_COLORS[project.status])}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{project.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{project.description || 'No description'}</p>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        {/* Budget */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Budget</span>
          <span className={budgetUsage > 90 ? 'text-red-600 font-medium' : 'font-medium'}>
            {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
          </span>
        </div>
        <Progress value={budgetUsage} className="h-1 mt-1" />

        {/* Milestones */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            {completedMilestones} / {project.milestones.length} milestones
          </span>
          {overdueMilestones > 0 && (
            <span className="text-red-600 flex items-center gap-1">
              <AlertCircle className="size-3" />
              {overdueMilestones} overdue
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="size-3" />{project.beneficiaries}</span>
            {project.location && <span className="flex items-center gap-1 truncate"><MapPin className="size-3" />{project.location}</span>}
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const budgetUsage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0
  const completedMilestones = project.milestones.filter(m => m.completed).length
  const avgRating = project.feedback.length > 0
    ? project.feedback.reduce((s, f) => s + f.rating, 0) / project.feedback.length
    : 0

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id, status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Project status updated to ${status}`)
      onClose()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="p-4 space-y-5">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={classNames('text-[10px] capitalize', CATEGORY_COLORS[project.category])}>
            {project.category}
          </Badge>
          <Badge variant="outline" className={classNames('text-[10px] capitalize', STATUS_COLORS[project.status])}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
        <SheetTitle className="text-lg">{project.name}</SheetTitle>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </SheetHeader>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Budget</div>
          <div className="text-base font-bold">{formatCurrency(project.budget)}</div>
          <div className="text-xs text-muted-foreground mt-1">{formatCurrency(project.spent)} spent ({budgetUsage}%)</div>
          <Progress value={budgetUsage} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Progress</div>
          <div className="text-base font-bold">{project.progress}%</div>
          <div className="text-xs text-muted-foreground mt-1">{completedMilestones} of {project.milestones.length} milestones done</div>
          <Progress value={project.progress} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Beneficiaries</div>
          <div className="text-base font-bold">{project.beneficiaries}</div>
          <div className="text-xs text-muted-foreground mt-1">Direct recipients</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg Feedback</div>
          <div className="text-base font-bold">{avgRating.toFixed(1)} / 5</div>
          <div className="text-xs text-muted-foreground mt-1">{project.feedback.length} responses</div>
        </div>
      </div>

      {/* Goal */}
      {project.goal && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Project Goal</div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
            {project.goal}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{formatDate(project.startDate)}</div>
            <div className="text-muted-foreground">Start date</div>
          </div>
        </div>
        {project.endDate && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{formatDate(project.endDate)}</div>
              <div className="text-muted-foreground">End date</div>
            </div>
          </div>
        )}
        {project.managerName && (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{project.managerName}</div>
              <div className="text-muted-foreground">Project Manager</div>
            </div>
          </div>
        )}
        {project.location && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{project.location}</div>
              <div className="text-muted-foreground">Location</div>
            </div>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Milestones</div>
        <div className="space-y-2">
          {project.milestones.map(m => {
            const overdue = !m.completed && new Date(m.dueDate) < new Date()
            return (
              <div key={m.id} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                {m.completed ? (
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
                ) : overdue ? (
                  <AlertCircle className="size-4 text-red-600 mt-0.5" />
                ) : (
                  <Circle className="size-4 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={classNames('text-sm font-medium', m.completed && 'line-through text-muted-foreground')}>{m.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Due {formatDate(m.dueDate)}
                    {m.completed && m.completedAt && ` · Completed ${formatDate(m.completedAt)}`}
                    {overdue && ` · OVERDUE`}
                  </div>
                </div>
              </div>
            )
          })}
          {project.milestones.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No milestones defined.</div>
          )}
        </div>
      </div>

      {/* Recent feedback */}
      {project.feedback.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recent Feedback</div>
          <div className="space-y-2">
            {project.feedback.slice(0, 3).map(f => (
              <div key={f.id} className="p-3 rounded-md border bg-muted/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  <Badge variant="outline" className={classNames(
                    'text-[10px]',
                    f.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                    f.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                  )}>
                    {f.sentiment}
                  </Badge>
                </div>
                <p className="text-xs mt-1">{f.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status changer */}
      <div className="pt-3 border-t">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Update Status</div>
        <div className="flex flex-wrap gap-2">
          {['planning', 'active', 'on_hold', 'delayed', 'completed'].map(s => (
            <Button
              key={s}
              variant={project.status === s ? 'default' : 'outline'}
              size="sm"
              className={project.status === s ? 'bg-emerald-600 hover:bg-emerald-700 text-xs capitalize' : 'text-xs capitalize'}
              onClick={() => updateStatus(s)}
              disabled={project.status === s}
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const { categories } = useCategories('project')
  const [form, setForm] = useState({
    name: '', description: '', category: 'infrastructure', goal: '',
    budget: '', startDate: '', endDate: '', managerName: '', location: '', beneficiaries: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name.trim() || !form.startDate) {
      toast.error('Project name and start date are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Project created')
      setOpen(false)
      onCreated()
      setForm({ name: '', description: '', category: 'infrastructure', goal: '', budget: '', startDate: '', endDate: '', managerName: '', location: '', beneficiaries: '' })
    } catch {
      toast.error('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <CardDescription className="text-xs">Define goals, budget, timeline, and responsible person.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Project Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  ) : (
                    categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Budget (KES)</Label>
              <Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Project Manager</Label>
              <Input value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Beneficiaries</Label>
              <Input type="number" value={form.beneficiaries} onChange={e => setForm({ ...form, beneficiaries: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Goal / Objective</Label>
            <Textarea value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Creating...' : 'Create Project'}
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
  color: 'emerald' | 'cyan' | 'red'
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    red: 'bg-red-100 text-red-600',
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
