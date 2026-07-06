'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Pin, Calendar, AlertCircle, Bell, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatRelative, classNames } from '@/lib/cms'
import { useCategories } from '@/hooks/use-categories'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  createdAt: string
  author: { name: string; role: string } | null
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  general: { label: 'General', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Bell className="size-3" /> },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="size-3" /> },
  event: { label: 'Event', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Calendar className="size-3" /> },
  meeting: { label: 'Meeting', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <Users className="size-3" /> },
}

export function CommunicationView() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [open, setOpen] = useState(false)

  const refresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => setItems(d.announcements || []))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const pinned = items.filter(a => a.pinned)
  const others = items.filter(a => !a.pinned)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Announcements" value={items.length} icon={<Megaphone className="size-4" />} color="emerald" />
        <StatCard label="Pinned" value={pinned.length} icon={<Pin className="size-4" />} color="amber" />
        <StatCard label="Urgent" value={items.filter(a => a.category === 'urgent').length} icon={<AlertCircle className="size-4" />} color="red" />
        <StatCard label="Events" value={items.filter(a => a.category === 'event').length} icon={<Calendar className="size-4" />} color="violet" />
      </div>

      {/* Communication tools */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Megaphone className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Communication Hub</div>
                <div className="text-xs text-muted-foreground">Send announcements via SMS, email, or in-app notifications</div>
              </div>
            </div>
            <AddAnnouncementDialog onCreated={refresh} />
          </div>
        </CardContent>
      </Card>

      {/* Pinned announcements */}
      {pinned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Pin className="size-4 text-amber-500" />
            Pinned Announcements
          </h3>
          <div className="space-y-3">
            {pinned.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AnnouncementCard announcement={a} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other announcements */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Recent Announcements</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : others.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No announcements yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {others.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AnnouncementCard announcement={a} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const cat = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG.general
  const initials = (announcement.author?.name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Card className={classNames(
      'hover:shadow-md transition-shadow',
      announcement.pinned && 'border-amber-200 bg-amber-50/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.pinned && <Pin className="size-3 text-amber-500" />}
                <h4 className="text-sm font-semibold">{announcement.title}</h4>
                <Badge variant="outline" className={classNames('text-[10px]', cat.color)}>
                  {cat.icon}
                  {cat.label}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatRelative(announcement.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{announcement.content}</p>
            <div className="text-[10px] text-muted-foreground mt-2">
              Posted by <span className="font-medium">{announcement.author?.name || 'System'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddAnnouncementDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const { categories } = useCategories('announcement')
  const [form, setForm] = useState({ title: '', content: '', category: 'general', pinned: false })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Announcement posted')
      setOpen(false)
      onCreated()
      setForm({ title: '', content: '', category: 'general', pinned: false })
    } catch {
      toast.error('Failed to post announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="size-4 mr-2" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Announcement</DialogTitle>
          <CardDescription className="text-xs">Communicate with community members about updates, events, and urgent matters.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="general">General</SelectItem>
                ) : (
                  categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Content *</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="mt-1" rows={4} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={form.pinned}
              onChange={e => setForm({ ...form, pinned: e.target.checked })}
              className="size-4 rounded border-gray-300"
            />
            <Label htmlFor="pinned" className="text-xs">Pin to top (high visibility)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Posting...' : 'Post Announcement'}
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
  color: 'emerald' | 'amber' | 'red' | 'violet'
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    violet: 'bg-violet-100 text-violet-600',
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
