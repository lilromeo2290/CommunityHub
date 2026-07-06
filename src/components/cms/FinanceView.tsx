'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, TrendingUp, TrendingDown, Wallet, FileText, Download,
  Gift, Landmark, CreditCard, Receipt, ArrowDownRight, ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, classNames } from '@/lib/cms'
import { toast } from 'sonner'

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string | null
  source: string | null
  date: string
  status: string
  project: { name: string } | null
}

interface FinanceData {
  transactions: Transaction[]
  summary: { income: number; expense: number; balance: number; count: number }
  byCategory: { category: string; income: number; expense: number }[]
  bySource: { name: string; value: number }[]
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  income: <TrendingUp className="size-4" />,
  donation: <Gift className="size-4" />,
  grant: <Landmark className="size-4" />,
  expense: <TrendingDown className="size-4" />,
}

const TYPE_COLORS: Record<string, string> = {
  income: 'text-emerald-600 bg-emerald-50',
  donation: 'text-rose-600 bg-rose-50',
  grant: 'text-violet-600 bg-violet-50',
  expense: 'text-red-600 bg-red-50',
}

const PIE_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b']

export function FinanceView() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const filteredTx = (data?.transactions || []).filter(t => !filter || filter === 'all' || t.type === filter)

  return (
    <div className="space-y-5">
      {/* Top stats */}
      {loading || !data ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ArrowUpRight className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</div>
                <div className="text-lg font-bold">{formatCurrency(data.summary.income)}</div>
                <div className="text-[11px] text-emerald-600">From {data.bySource.length} sources</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <ArrowDownRight className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Expense</div>
                <div className="text-lg font-bold">{formatCurrency(data.summary.expense)}</div>
                <div className="text-[11px] text-red-600">Across {data.byCategory.length} categories</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={classNames(
                'flex size-10 items-center justify-center rounded-lg',
                data.summary.balance >= 0 ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'
              )}>
                <Wallet className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Net Balance</div>
                <div className={classNames('text-lg font-bold', data.summary.balance < 0 && 'text-red-600')}>
                  {formatCurrency(data.summary.balance)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {data.summary.balance >= 0 ? 'Surplus' : 'Deficit'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Category breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Category</CardTitle>
              <CardDescription className="text-xs">Income vs expense by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byCategory} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funding sources */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Funding Sources</CardTitle>
              <CardDescription className="text-xs">Top sources of income & donations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.bySource}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => `${(entry.percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.bySource.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Transaction Log</CardTitle>
              <CardDescription className="text-xs">All financial transactions with approval status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <AddTransactionDialog onCreated={refresh} />
              <Button variant="outline" size="sm" className="h-8">
                <Download className="size-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Source / Payee</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Project</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.slice(0, 30).map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={classNames(
                            'flex size-6 items-center justify-center rounded-md flex-shrink-0',
                            TYPE_COLORS[tx.type] || 'bg-gray-100 text-gray-600'
                          )}>
                            {TYPE_ICONS[tx.type]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{tx.description || tx.category}</div>
                        <div className="text-[10px] text-muted-foreground sm:hidden capitalize">{tx.category.replace(/_/g, ' ')}</div>
                      </TableCell>
                      <TableCell className="text-xs capitalize hidden sm:table-cell">{tx.category.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{tx.source || '—'}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{tx.project?.name || '—'}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{formatDate(tx.date)}</TableCell>
                      <TableCell className="text-right">
                        <span className={classNames(
                          'text-xs font-semibold',
                          tx.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                        )}>
                          {tx.type === 'expense' ? '−' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transparency report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" /> Financial Transparency Report
          </CardTitle>
          <CardDescription className="text-xs">
            Public summary of community finances — auto-generated for accountability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Total Income</div>
              <div className="text-sm font-semibold text-emerald-600">{data ? formatCurrency(data.summary.income) : '—'}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Total Expense</div>
              <div className="text-sm font-semibold text-red-600">{data ? formatCurrency(data.summary.expense) : '—'}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Net Balance</div>
              <div className="text-sm font-semibold">{data ? formatCurrency(data.summary.balance) : '—'}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Transactions</div>
              <div className="text-sm font-semibold">{data?.summary.count || 0}</div>
            </div>
          </div>
          <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900">
            <strong>Accountability Statement:</strong> All community funds are managed transparently with full audit trails.
            Every transaction above 10,000 KES requires dual approval from a Finance Officer and Community Leader.
            Monthly financial reports are published and available to all community members.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddTransactionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'expense', category: 'supplies', amount: '', description: '',
    source: '', date: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.amount || !form.category) {
      toast.error('Amount and category are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Transaction recorded')
      setOpen(false)
      onCreated()
      setForm({ type: 'expense', category: 'supplies', amount: '', description: '', source: '', date: '' })
    } catch {
      toast.error('Failed to record transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
          <Plus className="size-3.5 mr-1.5" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <CardDescription className="text-xs">Log income, donation, grant, or expense.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1" placeholder="e.g. supplies, fundraising" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount (KES) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Source / Payee</Label>
            <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="mt-1" placeholder="Donor name or vendor" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
