import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      include: { author: { select: { name: true, role: true } } },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ announcements })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const announcement = await db.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || 'general',
        authorId: body.authorId || null,
        pinned: body.pinned || false,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'announcement',
        entityId: announcement.id,
        details: `Posted announcement: ${announcement.title}`,
      },
    })

    return NextResponse.json({ announcement })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
