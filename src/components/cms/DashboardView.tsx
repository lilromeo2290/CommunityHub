'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, Target, Wallet, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Heart, Award, Bell,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatDate, formatRelative, STATUS_COLORS, SEVERITY_COLORS, classNames } from '@/lib/cms'

interface DashboardData {
  kpis: {
    totalMembers: number
    activeMembers: number
    totalResourceValue: number
    lowStockCount: number
    activeProjects: number
    completedProjects: number
    delayedProjects: number
    totalBeneficiaries: number
    totalIncome: number
    totalExpense: number
    balance: number
    pendingApprovals: number
    openFeedback: number
    criticalAlerts: number
  }
  financeTrend: { label: string; income: number; expense: number }[]
  projectStatus: { name: string; value: number; color: string }[]
  resourceByCategory: { name: string; value: number }[]
  memberByCategory: { name: string; value: number }[]
  topNeeds: { name: string; value: number }[]
  contributionByType: { name: string; value: number }[]
  lowStockResources: { id: string; name: string; category: string; available: number; threshold: number; unit: string }[]
  alerts: any[]
  projects: any[]
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const k = data.kpis

  return (
    <div className="space-y-6">
      {/* Critical alert banner */}
      {k.criticalAlerts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="size-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-900">
              {k.criticalAlerts} critical alert{k.criticalAlerts > 1 ? 's' : ''} require attention
            </div>
            <div className="text-xs text-red-700 mt-0.5">
              {k.pendingApprovals} pending resource approvals · {k.lowStockCount} resources below threshold · {k.delayedProjects} delayed projects
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
            Review All
          </Button>
        </motion.div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Community Members"
          value={formatNumber(k.totalMembers)}
          subtext={`${k.activeMembers} active`}
          icon={<Users className="size-5" />}
          trend="+3 this month"
          trendUp
          color="emerald"
        />
        <KpiCard
          label="Available Funds"
          value={formatCurrency(k.totalResourceValue)}
          subtext="Across all reserves"
          icon={<Wallet className="size-5" />}
          trend="+12% vs last quarter"
          trendUp
          color="teal"
        />
        <KpiCard
          label="Active Projects"
          value={formatNumber(k.activeProjects)}
          subtext={`${k.completedProjects} completed · ${k.delayedProjects} delayed`}
          icon={<Target className="size-5" />}
          trend={`${k.totalBeneficiaries} beneficiaries`}
          color="cyan"
        />
        <KpiCard
          label="Financial Balance"
          value={formatCurrency(k.balance)}
          subtext={`Income ${formatCurrency(k.totalIncome)} · Expense ${formatCurrency(k.totalExpense)}`}
          icon={<TrendingUp className="size-5" />}
          trend={k.balance >= 0 ? 'Surplus' : 'Deficit'}
          trendUp={k.balance >= 0}
          color={k.balance >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat
          label="Pending Approvals"
          value={k.pendingApprovals}
          icon={<Clock className="size-4" />}
          color="amber"
        />
        <MiniStat
          label="Low-Stock Resources"
          value={k.lowStockCount}
          icon={<Package className="size-4" />}
          color="red"
        />
        <MiniStat
          label="Open Feedback"
          value={k.openFeedback}
          icon={<Heart className="size-4" />}
          color="rose"
        />
        <MiniStat
          label="Total Beneficiaries"
          value={k.totalBeneficiaries}
          icon={<Award className="size-4" />}
          color="emerald"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Finance trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Income vs Expenses</CardTitle>
                <CardDescription className="text-xs">Last 6 months</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500" /> Expense
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.financeTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#gInc)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Status</CardTitle>
            <CardDescription className="text-xs">Distribution by state</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.projectStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.projectStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Resource by category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resources by Category</CardTitle>
            <CardDescription className="text-xs">Inventory distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.resourceByCategory} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Member Categories</CardTitle>
            <CardDescription className="text-xs">Demographic breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.memberByCategory} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top needs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Community Needs</CardTitle>
            <CardDescription className="text-xs">From member assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {data.topNeeds.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No needs recorded</p>
            ) : (
              data.topNeeds.map((need, i) => {
                const max = data.topNeeds[0].value
                return (
                  <div key={need.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium">{need.name.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{need.value} {need.value === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(need.value / max) * 100}%` }}
                        transition={{ delay: i * 0.05 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts + Projects */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="size-4 text-amber-500" /> Active Alerts
                </CardTitle>
                <CardDescription className="text-xs">Risks, delays, shortages</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">{data.alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data.alerts.slice(0, 6).map(alert => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded-md border bg-muted/30">
                <span className={classNames('mt-1 size-2 rounded-full flex-shrink-0', SEVERITY_COLORS[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-tight">{alert.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{formatRelative(alert.createdAt)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Active Projects</CardTitle>
                <CardDescription className="text-xs">Progress overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {data.projects.slice(0, 6).map(p => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.managerName} · {p.location} · {p.beneficiaries} beneficiaries
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={classNames('text-[10px] capitalize border', STATUS_COLORS[p.status])}
                  >
                    {p.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-1.5" />
                  <span className="text-xs font-medium w-9 text-right">{p.progress}%</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>Budget: {formatCurrency(p.spent)} / {formatCurrency(p.budget)}</span>
                  <span>{Math.round((p.spent / Math.max(p.budget, 1)) * 100)}% used</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, subtext, icon, trend, trendUp, color,
}: {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  trend: string
  trendUp?: boolean
  color: 'emerald' | 'teal' | 'cyan' | 'red'
}) {
  const colorMap = {
    emerald: 'from-emerald-500 to-teal-600',
    teal: 'from-teal-500 to-cyan-600',
    cyan: 'from-cyan-500 to-blue-500',
    red: 'from-red-500 to-rose-600',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
            <div className="text-lg sm:text-2xl font-bold mt-1 truncate">{value}</div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{subtext}</div>
          </div>
          <div className={classNames('flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', colorMap[color])}>
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 text-[11px]">
          {trendUp !== undefined && (
            trendUp
              ? <ArrowUpRight className="size-3 text-emerald-600" />
              : <ArrowDownRight className="size-3 text-red-600" />
          )}
          <span className={trendUp === false ? 'text-red-600' : 'text-emerald-600'}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({
  label, value, icon, color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'amber' | 'red' | 'rose' | 'emerald'
}) {
  const colorMap = {
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    rose: 'text-rose-600 bg-rose-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  }
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <div className={classNames('flex size-8 items-center justify-center rounded-md', colorMap[color])}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg sm:text-xl font-bold leading-tight">{value}</div>
          <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
