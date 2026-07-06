import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      members,
      resources,
      projects,
      transactions,
      alerts,
      allocations,
      feedback,
      contributions,
    ] = await Promise.all([
      db.member.findMany(),
      db.resource.findMany(),
      db.project.findMany({ include: { milestones: true } }),
      db.transaction.findMany(),
      db.alert.findMany({ orderBy: { createdAt: 'desc' } }),
      db.resourceAllocation.findMany({ include: { resource: true, project: true } }),
      db.feedback.findMany(),
      db.contribution.findMany(),
    ])

    // KPIs
    const totalMembers = members.length
    const activeMembers = members.filter(m => m.status === 'active').length

    const totalResourceValue = resources.reduce((s, r) => s + (r.category === 'fund' ? r.quantity : 0), 0)
    const lowStockResources = resources.filter(r => r.quantity - r.reserved <= r.threshold)

    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const delayedProjects = projects.filter(p => p.status === 'delayed').length
    const planningProjects = projects.filter(p => p.status === 'planning').length
    const totalBeneficiaries = projects.reduce((s, p) => s + p.beneficiaries, 0)

    const totalIncome = transactions.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpense

    const pendingApprovals = allocations.filter(a => a.status === 'pending').length
    const openFeedback = feedback.filter(f => f.status === 'open').length
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length

    // Resource consumption trend (by category, last 6 months approximated)
    const now = new Date()
    const months: { label: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthTx = transactions.filter(t => t.date >= d && t.date < next)
      months.push({
        label: d.toLocaleDateString('en', { month: 'short' }),
        income: monthTx.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }

    // Project status distribution
    const statusDistribution = [
      { name: 'Active', value: activeProjects, color: '#10b981' },
      { name: 'Completed', value: completedProjects, color: '#0891b2' },
      { name: 'Delayed', value: delayedProjects, color: '#ef4444' },
      { name: 'Planning', value: planningProjects, color: '#f59e0b' },
    ]

    // Resource by category
    const resourceByCategory = resources.reduce((acc, r) => {
      const existing = acc.find(x => x.name === r.category)
      const value = r.category === 'fund' ? r.quantity : r.quantity
      if (existing) existing.value += value
      else acc.push({ name: r.category, value })
      return acc
    }, [] as { name: string; value: number }[])

    // Member categories
    const memberByCategory = members.reduce((acc, m) => {
      const existing = acc.find(x => x.name === m.category)
      if (existing) existing.value++
      else acc.push({ name: m.category, value: 1 })
      return acc
    }, [] as { name: string; value: number }[])

    // Top needs
    const needsCount: Record<string, number> = {}
    members.forEach(m => {
      if (m.needs) {
        m.needs.split(',').forEach(n => {
          const need = n.trim()
          if (need) needsCount[need] = (needsCount[need] || 0) + 1
        })
      }
    })
    const topNeeds = Object.entries(needsCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // Contribution value by type
    const contributionByType = contributions.reduce((acc, c) => {
      const existing = acc.find(x => x.name === c.type)
      if (existing) existing.value += c.value
      else acc.push({ name: c.type, value: c.value })
      return acc
    }, [] as { name: string; value: number }[])

    return NextResponse.json({
      kpis: {
        totalMembers,
        activeMembers,
        totalResourceValue,
        lowStockCount: lowStockResources.length,
        activeProjects,
        completedProjects,
        delayedProjects,
        totalBeneficiaries,
        totalIncome,
        totalExpense,
        balance,
        pendingApprovals,
        openFeedback,
        criticalAlerts,
      },
      financeTrend: months,
      projectStatus: statusDistribution,
      resourceByCategory,
      memberByCategory,
      topNeeds,
      contributionByType,
      lowStockResources: lowStockResources.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        available: r.quantity - r.reserved,
        threshold: r.threshold,
        unit: r.unit,
      })),
      alerts,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        spent: p.spent,
        beneficiaries: p.beneficiaries,
        managerName: p.managerName,
        location: p.location,
        startDate: p.startDate,
        endDate: p.endDate,
        category: p.category,
      })),
    })
  } catch (e) {
    console.error('Dashboard API error:', e)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
