'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, Star, MessageSquare, TrendingUp, AlertCircle,
  ThumbsUp, ThumbsDown, Meh, CheckCircle2, Clock, Activity, Award,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { formatRelative, classNames } from '@/lib/cms'
import { toast } from 'sonner'

interface FeedbackEntry {
  id: string
  rating: number
  category: string
  content: string
  sentiment: string
  status: string
  createdAt: string
  member: { fullName: string } | null
  project: { name: string } | null
}

interface MEData {
  feedback: FeedbackEntry[]
  sentimentSummary: { positive: number; neutral: number; negative: number }
  avgRating: number
  concerns: { name: string; count: number }[]
}

export function EvaluationView() {
  const [data, setData] = useState<MEData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [open, setOpen] = useState(false)

  const refresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [refreshKey])

  // Project performance data — derived from feedback per project
  const projectPerf = (() => {
    if (!data) return []
    const grouped = data.feedback.reduce((acc, f) => {
      const name = f.project?.name || 'General'
      if (!acc[name]) acc[name] = { name, total: 0, sum: 0, positive: 0, negative: 0 }
      acc[name].total++
      acc[name].sum += f.rating
      if (f.sentiment === 'positive') acc[name].positive++
      if (f.sentiment === 'negative') acc[name].negative++
      return acc
    }, {} as Record<string, any>)
    return Object.values(grouped).map((g: any) => ({
      ...g,
      avg: g.total > 0 ? Math.round((g.sum / g.total) * 10) / 10 : 0,
    })).sort((a: any, b: any) => b.avg - a.avg)
  })()

  // Sentiment trend (by createdAt month)
  const sentimentTrend = (() => {
    if (!data) return []
    const months: Record<string, { label: string; positive: number; neutral: number; negative: number }> = {}
    data.feedback.forEach(f => {
      const d = new Date(f.createdAt)
      const label = d.toLocaleDateString('en', { month: 'short' })
      if (!months[label]) months[label] = { label, positive: 0, neutral: 0, negative: 0 }
      months[label][f.sentiment as 'positive' | 'neutral' | 'negative']++
    })
    return Object.values(months).slice(-6)
  })()

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <Star className="size-4" />
            </div>
            <div>
              <div className="text-xl font-bold leading-tight">{data?.avgRating || '—'}</div>
              <div className="text-[11px] text-muted-foreground">Avg Rating</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
              <ThumbsUp className="size-4" />
            </div>
            <div>
              <div className="text-xl font-bold leading-tight">{data?.sentimentSummary.positive || 0}</div>
              <div className="text-[11px] text-muted-foreground">Positive Feedback</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
              <Meh className="size-4" />
            </div>
            <div>
              <div className="text-xl font-bold leading-tight">{data?.sentimentSummary.neutral || 0}</div>
              <div className="text-[11px] text-muted-foreground">Neutral</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-red-100 text-red-600">
              <ThumbsDown className="size-4" />
            </div>
            <div>
              <div className="text-xl font-bold leading-tight">{data?.sentimentSummary.negative || 0}</div>
              <div className="text-[11px] text-muted-foreground">Negative</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sentiment distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment Distribution</CardTitle>
            <CardDescription className="text-xs">All feedback entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positive', value: data?.sentimentSummary.positive || 0, color: '#10b981' },
                    { name: 'Neutral', value: data?.sentimentSummary.neutral || 0, color: '#94a3b8' },
                    { name: 'Negative', value: data?.sentimentSummary.negative || 0, color: '#ef4444' },
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {[
                    { name: 'Positive', value: data?.sentimentSummary.positive || 0, color: '#10b981' },
                    { name: 'Neutral', value: data?.sentimentSummary.neutral || 0, color: '#94a3b8' },
                    { name: 'Negative', value: data?.sentimentSummary.negative || 0, color: '#ef4444' },
                  ].map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top concerns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Concerns</CardTitle>
            <CardDescription className="text-xs">From negative/neutral feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {data?.concerns.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No major concerns detected</p>
            ) : (
              data?.concerns.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                  <span className="text-xs capitalize font-medium">{c.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{c.count} mentions</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Project performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Performance</CardTitle>
            <CardDescription className="text-xs">By average feedback rating</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectPerf} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '...' : v} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="avg" name="Avg Rating" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Impact Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4" /> Before & After Impact Assessment
          </CardTitle>
          <CardDescription className="text-xs">Key metrics showing project impact on community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ImpactCard
              metric="Water Access"
              before="500m avg distance"
              after="150m avg distance"
              improvement="70% improvement"
              positive
            />
            <ImpactCard
              metric="Night Safety"
              before="3 incidents/week"
              after="1 incident/week"
              improvement="67% reduction"
              positive
            />
            <ImpactCard
              metric="Textbook Ratio"
              before="1 book : 8 students"
              after="1 book : 3 students"
              improvement="167% improvement"
              positive
            />
            <ImpactCard
              metric="Vocational Training"
              before="0% enrollment"
              after="28% progress"
              improvement="Behind schedule"
              positive={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Community Feedback</CardTitle>
              <CardDescription className="text-xs">Real voices from community members</CardDescription>
            </div>
            <AddFeedbackDialog onCreated={refresh} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : (
            data?.feedback.map(f => (
              <FeedbackRow key={f.id} feedback={f} onAddressed={refresh} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ImpactCard({
  metric, before, after, improvement, positive,
}: {
  metric: string
  before: string
  after: string
  improvement: string
  positive: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-medium">{metric}</div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground w-12">Before</span>
          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">{before}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground w-12">After</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{after}</span>
        </div>
      </div>
      <div className={classNames(
        'mt-2 text-[11px] font-medium flex items-center gap-1',
        positive ? 'text-emerald-600' : 'text-amber-600'
      )}>
        <TrendingUp className="size-3" />
        {improvement}
      </div>
    </div>
  )
}

function FeedbackRow({ feedback, onAddressed }: { feedback: FeedbackEntry; onAddressed: () => void }) {
  const sentimentColor = feedback.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : feedback.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-50 text-gray-700 border-gray-200'

  const markAddressed = async () => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedback.id, status: 'addressed' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Feedback marked as addressed')
      onAddressed()
    } catch {
      toast.error('Failed to update feedback')
    }
  }

  return (
    <div className="p-3 rounded-md border bg-muted/30">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-amber-500 text-xs">
            {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
          </div>
          <Badge variant="outline" className={classNames('text-[10px] capitalize', sentimentColor)}>
            {feedback.sentiment}
          </Badge>
          {feedback.project && (
            <span className="text-[10px] text-muted-foreground">· {feedback.project.name}</span>
          )}
        </div>
        {feedback.status === 'open' ? (
          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={markAddressed}>
            Mark Addressed
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-3 mr-1" /> Addressed
          </Badge>
        )}
      </div>
      <p className="text-xs">{feedback.content}</p>
      <div className="text-[10px] text-muted-foreground mt-1">
        {feedback.member?.fullName || 'Anonymous'} · {formatRelative(feedback.createdAt)}
      </div>
    </div>
  )
}

function AddFeedbackDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ rating: '5', category: 'general', content: '', projectId: '' })
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
  }, [])

  const submit = async () => {
    if (!form.content.trim()) {
      toast.error('Please enter feedback content')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, rating: parseInt(form.rating) }
      if (payload.projectId === 'none') payload.projectId = ''
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Feedback submitted')
      setOpen(false)
      onCreated()
      setForm({ rating: '5', category: 'general', content: '', projectId: '' })
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
          <MessageSquare className="size-3.5 mr-1.5" />
          Submit Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <CardDescription className="text-xs">Share your experience or concern about a project or community matter.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rating</Label>
              <Select value={form.rating} onValueChange={v => setForm({ ...form, rating: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">★★★★★ Excellent</SelectItem>
                  <SelectItem value="4">★★★★ Good</SelectItem>
                  <SelectItem value="3">★★★ Average</SelectItem>
                  <SelectItem value="2">★★ Poor</SelectItem>
                  <SelectItem value="1">★ Very Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Related Project (optional)</Label>
            <Select value={form.projectId} onValueChange={v => setForm({ ...form, projectId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Your Feedback *</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="mt-1" rows={4} placeholder="Share your experience, suggestions, or concerns..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
