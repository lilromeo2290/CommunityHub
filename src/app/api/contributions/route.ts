import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const contributions = await db.contribution.findMany({
      include: { member: { select: { fullName: true, category: true } } },
      orderBy: { date: 'desc' },
    })

    const totalValue = contributions.reduce((s, c) => s + c.value, 0)
    const byType = contributions.reduce((acc, c) => {
      const existing = acc.find(x => x.type === c.type)
      if (existing) {
        existing.value += c.value
        existing.count++
      } else {
        acc.push({ type: c.type, value: c.value, count: 1 })
      }
      return acc
    }, [] as { type: string; value: number; count: number }[])

    return NextResponse.json({ contributions, totalValue, byType })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }
}
