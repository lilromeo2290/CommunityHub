import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ logs })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
