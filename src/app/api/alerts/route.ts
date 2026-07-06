import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const alerts = await db.alert.findMany({
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ alerts })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    const alert = await db.alert.update({
      where: { id },
      data: { acknowledged: true },
    })
    return NextResponse.json({ alert })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
  }
}
