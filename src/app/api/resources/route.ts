import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      include: {
        allocations: { orderBy: { createdAt: 'desc' }, take: 5, include: { project: true } },
      },
      orderBy: { name: 'asc' },
    })

    const enriched = resources.map(r => {
      const available = r.quantity - r.reserved
      const utilization = r.quantity > 0 ? Math.round((r.reserved / r.quantity) * 100) : 0
      const status = available <= 0 ? 'out' : available <= r.threshold ? 'low' : 'ok'
      return { ...r, available, utilization, status }
    })

    return NextResponse.json({ resources: enriched })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const resource = await db.resource.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit || 'unit',
        quantity: parseFloat(body.quantity) || 0,
        threshold: parseFloat(body.threshold) || 0,
        location: body.location || null,
        description: body.description || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'resource',
        entityId: resource.id,
        details: `Created resource: ${resource.name}`,
      },
    })

    return NextResponse.json({ resource })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
