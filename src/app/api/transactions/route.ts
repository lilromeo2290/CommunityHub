import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''

    const transactions = await db.transaction.findMany({
      where: type ? { type } : {},
      include: { project: { select: { name: true } } },
      orderBy: { date: 'desc' },
    })

    const income = transactions.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Group by category
    const byCategory = transactions.reduce((acc, t) => {
      const existing = acc.find(x => x.category === t.category)
      if (existing) {
        if (t.type === 'expense') existing.expense += t.amount
        else existing.income += t.amount
      } else {
        acc.push({
          category: t.category,
          income: t.type === 'expense' ? 0 : t.amount,
          expense: t.type === 'expense' ? t.amount : 0,
        })
      }
      return acc
    }, [] as { category: string; income: number; expense: number }[])

    // Group by source
    const bySource = transactions
      .filter(t => t.type !== 'expense' && t.source)
      .reduce((acc, t) => {
        const existing = acc.find(x => x.name === t.source)
        if (existing) existing.value += t.amount
        else acc.push({ name: t.source!, value: t.amount })
        return acc
      }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    return NextResponse.json({
      transactions,
      summary: {
        income,
        expense,
        balance: income - expense,
        count: transactions.length,
      },
      byCategory,
      bySource,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const transaction = await db.transaction.create({
      data: {
        type: body.type,
        category: body.category,
        amount: parseFloat(body.amount),
        description: body.description || null,
        source: body.source || null,
        projectId: body.projectId || null,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status || 'completed',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'transaction',
        entityId: transaction.id,
        details: `Recorded ${transaction.type}: ${transaction.amount} KES`,
      },
    })

    return NextResponse.json({ transaction })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
// trigger reload Mon Jul  6 22:58:16 UTC 2026
