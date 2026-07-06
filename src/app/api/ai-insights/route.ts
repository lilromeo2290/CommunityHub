import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// AI-Powered Insights — combines heuristic analysis with the data we have.
// In production this would call an LLM (z-ai-web-dev-sdk), but for reliability
// and offline-friendly operation we derive insights from deterministic rules.
export async function GET() {
  try {
    const [resources, projects, transactions, allocations, feedback, members, alerts] = await Promise.all([
      db.resource.findMany({ include: { allocations: true } }),
      db.project.findMany({ include: { milestones: true, feedback: true } }),
      db.transaction.findMany(),
      db.resourceAllocation.findMany({ include: { resource: true, project: true } }),
      db.feedback.findMany(),
      db.member.findMany(),
      db.alert.findMany(),
    ])

    const insights: Array<{
      type: string
      priority: string
      title: string
      description: string
      recommendation: string
      metric?: string
    }> = []

    // 1. Predict future resource needs — resources trending toward shortage
    resources.forEach(r => {
      const available = r.quantity - r.reserved
      if (available <= r.threshold) {
        const recentAllocations = r.allocations.filter(a => {
          const days = (Date.now() - a.createdAt.getTime()) / 86400000
          return days < 60
        })
        const monthlyBurn = recentAllocations.reduce((s, a) => s + a.quantity, 0) / 2
        const daysToOut = monthlyBurn > 0 ? Math.round(available / (monthlyBurn / 30)) : null

        insights.push({
          type: 'resource_prediction',
          priority: available <= 0 ? 'critical' : 'high',
          title: `${r.name} shortage predicted`,
          description: `Currently ${available} ${r.unit} available (threshold: ${r.threshold}). Recent monthly consumption: ${Math.round(monthlyBurn)} ${r.unit}.`,
          recommendation: daysToOut
            ? `At current usage, stockout in ~${daysToOut} days. Reorder immediately with min qty ${Math.ceil(monthlyBurn * 3)} ${r.unit}.`
            : `Reorder to maintain buffer above ${r.threshold} ${r.unit}.`,
          metric: `${available} / ${r.threshold} ${r.unit}`,
        })
      }
    })

    // 2. Identify inefficient resource usage — resources with high reservation but low distribution
    resources.forEach(r => {
      const totalAllocated = r.allocations.length
      const distributed = r.allocations.filter(a => a.status === 'distributed').length
      if (totalAllocated >= 3 && distributed / totalAllocated < 0.4) {
        insights.push({
          type: 'inefficiency',
          priority: 'medium',
          title: `Low distribution rate for ${r.name}`,
          description: `Only ${distributed} of ${totalAllocated} allocations have been distributed. Bottleneck in approval/distribution workflow.`,
          recommendation: `Review pending approvals. Streamline distribution process for ${r.name}.`,
          metric: `${Math.round((distributed / totalAllocated) * 100)}% distributed`,
        })
      }
    })

    // 3. Better allocation strategy — projects with budget vs spent imbalance
    projects.forEach(p => {
      if (p.status === 'active' || p.status === 'delayed') {
        const budgetUsage = p.budget > 0 ? (p.spent / p.budget) * 100 : 0
        const progressGap = budgetUsage - p.progress
        if (progressGap > 15) {
          insights.push({
            type: 'allocation_strategy',
            priority: 'high',
            title: `${p.name}: Budget outpacing progress`,
            description: `Budget is ${Math.round(budgetUsage)}% spent but project is only ${p.progress}% complete. Risk of cost overrun.`,
            recommendation: `Reallocate funds or restructure phases. Consider freezing non-critical spending and reviewing cost estimates.`,
            metric: `${Math.round(budgetUsage)}% budget / ${p.progress}% progress`,
          })
        }
      }
    })

    // 4. Detect project delays and risks
    projects.forEach(p => {
      if (p.status === 'delayed') {
        const overdueMilestones = p.milestones.filter(m => !m.completed && m.dueDate < new Date()).length
        insights.push({
          type: 'delay_risk',
          priority: 'critical',
          title: `${p.name} is delayed`,
          description: `${overdueMilestones} milestone(s) overdue. Project ${p.progress}% complete.`,
          recommendation: `Conduct immediate review meeting. Consider scope reduction or resource reallocation. Update stakeholders.`,
          metric: `${overdueMilestones} overdue milestones`,
        })
      }
      // Approaching deadline check
      if (p.endDate && p.status === 'active') {
        const daysToDeadline = Math.round((p.endDate.getTime() - Date.now()) / 86400000)
        if (daysToDeadline < 30 && p.progress < 80) {
          insights.push({
            type: 'deadline_risk',
            priority: 'high',
            title: `${p.name}: Deadline at risk`,
            description: `Only ${daysToDeadline} days remaining but project is ${p.progress}% complete.`,
            recommendation: `Add resources or extend deadline. Communicate proactively with beneficiaries.`,
            metric: `${daysToDeadline} days / ${p.progress}% done`,
          })
        }
      }
    })

    // 5. Analyze community feedback — top concerns
    const negativeFeedback = feedback.filter(f => f.sentiment === 'negative')
    if (negativeFeedback.length > 0) {
      const text = negativeFeedback.map(f => f.content.toLowerCase()).join(' ')
      const themes = [
        { theme: 'communication', keywords: ['communicate', 'communication', 'inform', 'notice'] },
        { theme: 'scheduling', keywords: ['delay', 'late', 'schedule', 'timeline'] },
        { theme: 'supplies', keywords: ['stock', 'supplies', 'shortage', 'run out', 'medicine'] },
        { theme: 'transparency', keywords: ['transparency', 'report', 'funds', 'spent'] },
      ]
      const detected = themes
        .map(t => ({ ...t, count: t.keywords.reduce((s, k) => s + (text.match(new RegExp(`\\b${k}\\b`, 'g')) || []).length, 0) }))
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count)

      if (detected.length > 0) {
        insights.push({
          type: 'feedback_analysis',
          priority: 'medium',
          title: `Top community concern: ${detected[0].theme}`,
          description: `${negativeFeedback.length} negative feedback entries analyzed. Strongest theme: "${detected[0].theme}" mentioned ${detected[0].count} times.`,
          recommendation: `Address ${detected[0].theme} issues in next community meeting. Update related processes and communicate improvements.`,
          metric: `${detected[0].count} mentions`,
        })
      }
    }

    // 6. Funding sustainability
    const income = transactions.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const runway = expense > 0 ? Math.round(((income - expense) / expense) * 100) : 0
    if (runway < 20) {
      insights.push({
        type: 'funding_risk',
        priority: 'high',
        title: 'Low financial runway',
        description: `Current surplus is only ${runway}% of total expenses. Funding diversification needed.`,
        recommendation: `Pursue 2-3 new funding sources. Apply for grants. Launch fundraising campaign within 30 days.`,
        metric: `${runway}% surplus`,
      })
    }

    // 7. Volunteer capacity
    const volunteerHours = resources.find(r => r.category === 'human')
    if (volunteerHours && volunteerHours.quantity - volunteerHours.reserved < volunteerHours.threshold) {
      insights.push({
        type: 'capacity_risk',
        priority: 'medium',
        title: 'Volunteer capacity stretched',
        description: `Available volunteer hours (${volunteerHours.quantity - volunteerHours.reserved}) below threshold (${volunteerHours.threshold}).`,
        recommendation: `Recruit 5-10 new volunteers. Schedule orientation session. Match skills to project needs.`,
        metric: `${volunteerHours.quantity - volunteerHours.reserved}h available`,
      })
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    insights.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder])

    // Summary metrics
    const summary = {
      total: insights.length,
      critical: insights.filter(i => i.priority === 'critical').length,
      high: insights.filter(i => i.priority === 'high').length,
      medium: insights.filter(i => i.priority === 'medium').length,
      actionRequired: insights.filter(i => i.priority === 'critical' || i.priority === 'high').length,
    }

    return NextResponse.json({ insights, summary })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
