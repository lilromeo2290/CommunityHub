import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (!includeInactive) where.active = true

    const categories = await db.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })

    return NextResponse.json({ categories })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.type || !body.value || !body.label) {
      return NextResponse.json({ error: 'type, value, and label are required' }, { status: 400 })
    }

    // Normalize value: lowercase, replace spaces with underscore
    const value = String(body.value).toLowerCase().trim().replace(/\s+/g, '_')

    // Check for duplicate
    const existing = await db.category.findUnique({
      where: { type_value: { type: body.type, value } },
    })
    if (existing) {
      return NextResponse.json({ error: 'A category with this value already exists for this type' }, { status: 409 })
    }

    const category = await db.category.create({
      data: {
        type: body.type,
        value,
        label: String(body.label).trim(),
        color: body.color || 'gray',
        icon: body.icon || null,
        active: body.active !== false,
        isSystem: false,
        sortOrder: body.sortOrder ? parseInt(body.sortOrder) : 0,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'category',
        entityId: category.id,
        details: `Created category: ${category.label} (${category.type}/${category.value})`,
      },
    })

    return NextResponse.json({ category })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Normalize value if changing
    if (updates.value) {
      updates.value = String(updates.value).toLowerCase().trim().replace(/\s+/g, '_')
      // Check for duplicate (excluding self)
      const dupe = await db.category.findFirst({
        where: { type: existing.type, value: updates.value, NOT: { id } },
      })
      if (dupe) {
        return NextResponse.json({ error: 'Another category with this value already exists' }, { status: 409 })
      }
    }

    if (updates.sortOrder !== undefined) {
      updates.sortOrder = parseInt(updates.sortOrder) || 0
    }

    const category = await db.category.update({
      where: { id },
      data: updates,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        entity: 'category',
        entityId: id,
        details: `Updated category: ${category.label}`,
      },
    })

    return NextResponse.json({ category })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: 'System categories cannot be deleted. Deactivate instead.' }, { status: 400 })
    }

    await db.category.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        entity: 'category',
        entityId: id,
        details: `Deleted category: ${existing.label} (${existing.type}/${existing.value})`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
