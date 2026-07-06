import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const users = await db.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { email: { contains: search } },
                ],
              }
            : {},
          role ? { role } : {},
        ],
      },
      include: {
        member: { select: { id: true, fullName: true, category: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check for duplicate email
    const existing = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const validRoles = ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member']
    const role = validRoles.includes(body.role) ? body.role : 'member'

    const user = await db.user.create({
      data: {
        email: body.email.toLowerCase().trim(),
        name: body.name.trim(),
        role,
        active: body.active !== false,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'user',
        entityId: user.id,
        details: `Created user: ${user.name} (${user.role})`,
      },
    })

    return NextResponse.json({ user })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last admin
    if (existing.role === 'admin' && updates.role && updates.role !== 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin', active: true } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot change role of the last admin. Promote another user to admin first.' }, { status: 400 })
      }
    }

    // Normalize email
    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim()
      const dupe = await db.user.findFirst({
        where: { email: updates.email, NOT: { id } },
      })
      if (dupe) {
        return NextResponse.json({ error: 'Another user with this email already exists' }, { status: 409 })
      }
    }

    if (updates.name) updates.name = updates.name.trim()

    const validRoles = ['admin', 'leader', 'project_manager', 'finance', 'volunteer', 'member']
    if (updates.role && !validRoles.includes(updates.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id },
      data: updates,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        entity: 'user',
        entityId: id,
        details: `Updated user: ${user.name} (role: ${user.role})`,
      },
    })

    return NextResponse.json({ user })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (existing.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin', active: true } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin account. Promote another user first.' }, { status: 400 })
      }
    }

    // If user has a linked member profile, disassociate by deleting member too (or block)
    const member = await db.member.findUnique({ where: { userId: id } })
    if (member) {
      return NextResponse.json({
        error: `This user has a linked member profile (${member.fullName}). Remove or reassign the member profile first.`,
      }, { status: 400 })
    }

    await db.user.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        entity: 'user',
        entityId: id,
        details: `Deleted user: ${existing.name} (${existing.email})`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
