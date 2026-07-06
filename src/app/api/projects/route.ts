import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''

    const projects = await db.project.findMany({
      where: status ? { status } : {},
      include: {
        milestones: { orderBy: { dueDate: 'asc' } },
        feedback: true,
        allocations: { include: { resource: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = await db.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category || 'infrastructure',
        goal: body.goal || null,
        budget: parseFloat(body.budget) || 0,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        managerName: body.managerName || null,
        location: body.location || null,
        beneficiaries: parseInt(body.beneficiaries) || 0,
        status: 'planning',
        progress: 0,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'project',
        entityId: project.id,
        details: `Created project: ${project.name}`,
      },
    })

    return NextResponse.json({ project })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updates } = data

    if (updates.startDate) updates.startDate = new Date(updates.startDate)
    if (updates.endDate) updates.endDate = new Date(updates.endDate)
    if (updates.budget) updates.budget = parseFloat(updates.budget)
    if (updates.progress !== undefined) updates.progress = parseFloat(updates.progress)

    const project = await db.project.update({
      where: { id },
      data: updates,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        entity: 'project',
        entityId: id,
        details: `Updated project: ${project.name}`,
      },
    })

    return NextResponse.json({ project })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}
