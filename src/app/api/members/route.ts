import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const members = await db.member.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search } },
                  { phone: { contains: search } },
                  { address: { contains: search } },
                  { skills: { contains: search } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      include: {
        user: { select: { role: true, email: true } },
        contributions: true,
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json({ members })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Create a user first, then a member
    const email = body.email || `${body.fullName.toLowerCase().replace(/\s+/g, '.')}@cms.org`
    const user = await db.user.create({
      data: {
        email,
        name: body.fullName,
        role: body.role || 'member',
      },
    })

    const member = await db.member.create({
      data: {
        userId: user.id,
        fullName: body.fullName,
        gender: body.gender || null,
        age: body.age ? parseInt(body.age) : null,
        phone: body.phone || null,
        address: body.address || null,
        category: body.category || 'general',
        skills: body.skills || null,
        needs: body.needs || null,
        householdSize: body.householdSize ? parseInt(body.householdSize) : 1,
        status: 'active',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'member',
        entityId: member.id,
        details: `Registered new member: ${member.fullName}`,
      },
    })

    return NextResponse.json({ member })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
