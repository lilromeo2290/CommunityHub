'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Plus, Pencil, Trash2, Check, X, AlertTriangle, Tag,
  Users, Package, Target, Megaphone, MessageSquare, Wallet, Power,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import { classNames } from '@/lib/cms'
import { toast } from 'sonner'

interface Category {
  id: string
  type: string
  value: string
  label: string
  color: string
  icon: string | null
  active: boolean
  isSystem: boolean
  sortOrder: number
  createdAt: string
}

const CATEGORY_TYPES = [
  { type: 'member', label: 'Members', icon: <Users className="size-4" />, description: 'Member demographic categories (leader, volunteer, family, etc.)' },
  { type: 'resource', label: 'Resources', icon: <Package className="size-4" />, description: 'Resource inventory categories (food, medicine, equipment, etc.)' },
  { type: 'project', label: 'Projects', icon: <Target className="size-4" />, description: 'Project initiative categories (infrastructure, health, education, etc.)' },
  { type: 'announcement', label: 'Announcements', icon: <Megaphone className="size-4" />, description: 'Announcement types (general, urgent, event, etc.)' },
  { type: 'feedback', label: 'Feedback', icon: <MessageSquare className="size-4" />, description: 'Feedback categories (general, project, resource, etc.)' },
  { type: 'transaction_type', label: 'Transaction Types', icon: <Wallet className="size-4" />, description: 'Financial transaction types (income, donation, grant, expense)' },
]

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'violet', label: 'Violet', class: 'bg-violet-100 text-violet-700 border-violet-200' },
]

function colorClass(color: string): string {
  return COLOR_OPTIONS.find(c => c.value === color)?.class || COLOR_OPTIONS[0].class
}

export function SettingsView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('member')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/api/categories?includeInactive=true')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh, refreshKey])

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, active: !cat.active }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${cat.label} ${cat.active ? 'deactivated' : 'activated'}`)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to update category')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/categories?id=${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success(`${deleting.label} deleted`)
      setDeleting(null)
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete category')
    }
  }

  const filtered = categories.filter(c => c.type === tab)
  const activeCount = filtered.filter(c => c.active).length

  // Aggregate counts across types
  const countsByType = CATEGORY_TYPES.reduce((acc, t) => {
    acc[t.type] = {
      total: categories.filter(c => c.type === t.type).length,
      active: categories.filter(c => c.type === t.type && c.active).length,
    }
    return acc
  }, {} as Record<string, { total: number; active: number }>)

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <Card className="border-emerald-200">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Settings className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Category Manager</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add, edit, deactivate, or delete categories used across all modules. Changes take effect immediately in all dropdowns.
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreating(true)}>
            <Plus className="size-4 mr-2" />
            Add Category
          </Button>
        </CardContent>
      </Card>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORY_TYPES.map(t => {
          const c = countsByType[t.type] || { total: 0, active: 0 }
          return (
            <Card key={t.type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab(t.type)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex size-6 items-center justify-center rounded bg-emerald-100 text-emerald-600">
                    {t.icon}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.label}</span>
                </div>
                <div className="text-lg font-bold leading-tight">{c.active}<span className="text-xs text-muted-foreground">/{c.total}</span></div>
                <div className="text-[10px] text-muted-foreground">active</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORY_TYPES.map(t => (
            <TabsTrigger key={t.type} value={t.type} className="gap-1.5">
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_TYPES.map(t => (
          <TabsContent key={t.type} value={t.type} className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{t.label} Categories</h3>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activeCount} active · {filtered.length} total
              </Badge>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No categories yet. Click "Add Category" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <CategoryRow
                      category={cat}
                      onEdit={() => setEditing(cat)}
                      onDelete={() => setDeleting(cat)}
                      onToggle={() => handleToggleActive(cat)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create dialog */}
      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        defaultType={tab}
        onSaved={() => { setCreating(false); setRefreshKey(k => k + 1) }}
      />

      {/* Edit dialog */}
      <CategoryDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        category={editing}
        onSaved={() => { setEditing(null); setRefreshKey(k => k + 1) }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Delete category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <strong>{deleting?.label}</strong> ({deleting?.value}).
              Records already using this category will keep the raw value but the label will no longer be recognized in dropdowns.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CategoryRow({
  category, onEdit, onDelete, onToggle,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <Card className={classNames(!category.active && 'opacity-60')}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
          <Tag className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{category.label}</span>
            <Badge variant="outline" className={classNames('text-[10px]', colorClass(category.color))}>
              {category.color}
            </Badge>
            <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {category.value}
            </code>
            {category.isSystem && (
              <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200">
                System
              </Badge>
            )}
            {!category.active && (
              <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500">
                Inactive
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Sort order: {category.sortOrder} · Created {new Date(category.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2">
            <Switch checked={category.active} onCheckedChange={onToggle} className="scale-90" />
            <Power className="size-3 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} title="Edit">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
            disabled={category.isSystem}
            title={category.isSystem ? 'System categories cannot be deleted — deactivate instead' : 'Delete'}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDialog({
  open, onOpenChange, category, defaultType, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  category?: Category | null
  defaultType?: string
  onSaved: () => void
}) {
  const isEdit = !!category
  const [form, setForm] = useState({
    type: category?.type || defaultType || 'member',
    value: category?.value || '',
    label: category?.label || '',
    color: category?.color || 'gray',
    sortOrder: category?.sortOrder?.toString() || '0',
    active: category?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        type: category?.type || defaultType || 'member',
        value: category?.value || '',
        label: category?.label || '',
        color: category?.color || 'gray',
        sortOrder: category?.sortOrder?.toString() || '0',
        active: category?.active ?? true,
      })
    }
  }, [open, category, defaultType])

  const submit = async () => {
    if (!form.label.trim() || !form.value.trim()) {
      toast.error('Label and Value are required')
      return
    }
    setSaving(true)
    try {
      const url = '/api/categories'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit
        ? { id: category!.id, ...form }
        : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <CardDescription className="text-xs">
            Categories appear in dropdowns across the platform. Use clear, descriptive labels.
          </CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Module / Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })} disabled={isEdit}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map(t => (
                  <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-[10px] text-muted-foreground mt-1">Type cannot be changed after creation.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Label *</Label>
              <Input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="mt-1"
                placeholder="e.g. Disabled / PWD"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Display name users see.</p>
            </div>
            <div>
              <Label className="text-xs">Value *</Label>
              <Input
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                className="mt-1"
                placeholder="e.g. disabled"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Stored identifier. Auto-lowercased.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Badge Color</Label>
              <Select value={form.color} onValueChange={v => setForm({ ...form, color: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className={classNames('size-3 rounded-full border', c.class.split(' ')[0].replace('text-', 'bg-').replace('700', '500').replace('200', '500'))} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Lower numbers appear first.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              id="active"
            />
            <Label htmlFor="active" className="text-xs cursor-pointer">Active (visible in dropdowns)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
