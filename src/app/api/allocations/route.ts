import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allocations = await db.resourceAllocation.findMany({
      include: {
        resource: true,
        project: true,
        approver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ allocations })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const allocation = await db.resourceAllocation.create({
      data: {
        resourceId: body.resourceId,
        projectId: body.projectId || null,
        quantity: parseFloat(body.quantity),
        reason: body.reason,
        status: 'pending',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'allocation',
        entityId: allocation.id,
        details: `Requested allocation of ${allocation.quantity} units`,
      },
    })

    return NextResponse.json({ allocation })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create allocation' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action } = body // action: 'approve' | 'reject' | 'distribute'

    const allocation = await db.resourceAllocation.findUnique({
      where: { id },
      include: { resource: true },
    })
    if (!allocation) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    let newStatus = allocation.status
    let reservedDelta = 0

    if (action === 'approve') {
      newStatus = 'approved'
      reservedDelta = allocation.quantity // reserve the quantity
    } else if (action === 'reject') {
      newStatus = 'rejected'
    } else if (action === 'distribute') {
      newStatus = 'distributed'
      // Actually deduct from resource quantity
      await db.resource.update({
        where: { id: allocation.resourceId },
        data: {
          quantity: { decrement: allocation.quantity },
          reserved: { decrement: allocation.quantity },
        },
      })
    }

    const updated = await db.resourceAllocation.update({
      where: { id },
      data: {
        status: newStatus,
        approverId: body.approverId || null,
        approvedAt: action === 'approve' ? new Date() : allocation.approvedAt,
      },
    })

    if (reservedDelta !== 0 && action === 'approve') {
      await db.resource.update({
        where: { id: allocation.resourceId },
        data: { reserved: { increment: reservedDelta } },
      })
    }

    await db.auditLog.create({
      data: {
        action: action,
        entity: 'allocation',
        entityId: id,
        details: `Allocation ${newStatus}: ${allocation.quantity} ${allocation.resource.unit} of ${allocation.resource.name}`,
      },
    })

    return NextResponse.json({ allocation: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update allocation' }, { status: 500 })
  }
}
