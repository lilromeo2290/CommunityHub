'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, Phone, MapPin, Award, Heart, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_LABELS, formatDate, formatRelative, classNames } from '@/lib/cms'
import { toast } from 'sonner'

interface Member {
  id: string
  fullName: string
  gender: string | null
  age: number | null
  phone: string | null
  address: string | null
  category: string
  skills: string | null
  needs: string | null
  householdSize: number
  status: string
  joinedAt: string
  user: { role: string; email: string }
  contributions: { type: string; value: number }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  leader: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  volunteer: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  family: 'bg-violet-100 text-violet-700 border-violet-200',
  youth: 'bg-amber-100 text-amber-700 border-amber-200',
  elder: 'bg-rose-100 text-rose-700 border-rose-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function MembersView() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [open, setOpen] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category && category !== 'all') params.set('category', category)
    fetch(`/api/members?${params}`)
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, category])

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, address, skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="leader">Leaders</SelectItem>
            <SelectItem value="volunteer">Volunteers</SelectItem>
            <SelectItem value="family">Families</SelectItem>
            <SelectItem value="youth">Youth</SelectItem>
            <SelectItem value="elder">Elders</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="size-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <AddMemberDialog onCreated={() => { setOpen(false); load() }} />
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total Members" value={members.length.toString()} />
        <StatTile label="Active" value={members.filter(m => m.status === 'active').length.toString()} />
        <StatTile label="Volunteers" value={members.filter(m => m.category === 'volunteer').length.toString()} />
        <StatTile label="Total Household Reach" value={members.reduce((s, m) => s + m.householdSize, 0).toString()} />
      </div>

      {/* Member list */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No members found. Try adjusting filters or add a new member.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <MemberCard member={m} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  const initials = member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const totalContrib = member.contributions.reduce((s, c) => s + c.value, 0)
  const skills = member.skills?.split(',').filter(Boolean).map(s => s.trim()) || []
  const needs = member.needs?.split(',').filter(Boolean).map(s => s.trim()) || []

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{member.fullName}</div>
            <div className="text-[11px] text-muted-foreground">
              {ROLE_LABELS[member.user.role] || member.user.role}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge
                variant="outline"
                className={classNames('text-[10px] capitalize', CATEGORY_COLORS[member.category] || CATEGORY_COLORS.general)}
              >
                {member.category}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {member.householdSize} household
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3.5" /> <span className="truncate">{member.phone}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5" /> <span className="truncate">{member.address}</span>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Skills</div>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 4).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px] capitalize bg-emerald-50 text-emerald-700">
                  {s.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {needs.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
              <Heart className="size-3" /> Needs
            </div>
            <div className="flex flex-wrap gap-1">
              {needs.slice(0, 3).map(n => (
                <Badge key={n} variant="secondary" className="text-[10px] capitalize bg-rose-50 text-rose-700">
                  {n.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Award className="size-3" />
            {member.contributions.length} contributions · {totalContrib} value
          </span>
          <span>Joined {formatDate(member.joinedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function AddMemberDialog({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: '', gender: '', age: '', phone: '', address: '',
    category: 'general', skills: '', needs: '', householdSize: '1', email: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`${form.fullName} added successfully`)
      onCreated()
    } catch {
      toast.error('Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Community Member</DialogTitle>
        <CardDescription className="text-xs">
          Register a new member with their demographic and skills information.
        </CardDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2">
          <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
          <Input id="fullName" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Gender</Label>
          <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Age</Label>
          <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+254..." />
        </div>
        <div>
          <Label className="text-xs">Household Size</Label>
          <Input type="number" value={form.householdSize} onChange={e => setForm({ ...form, householdSize: e.target.value })} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Address</Label>
          <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="leader">Leader</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
              <SelectItem value="elder">Elder</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Skills (comma-separated)</Label>
          <Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="mt-1" placeholder="e.g. teaching, carpentry, accounting" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Needs (comma-separated)</Label>
          <Input value={form.needs} onChange={e => setForm({ ...form, needs: e.target.value })} className="mt-1" placeholder="e.g. healthcare, education" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onCreated()}>Cancel</Button>
        <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? 'Saving...' : 'Add Member'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
