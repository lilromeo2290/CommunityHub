import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId') || ''

    const feedback = await db.feedback.findMany({
      where: projectId ? { projectId } : {},
      include: {
        member: { select: { fullName: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Sentiment summary
    const sentimentSummary = {
      positive: feedback.filter(f => f.sentiment === 'positive').length,
      neutral: feedback.filter(f => f.sentiment === 'neutral').length,
      negative: feedback.filter(f => f.sentiment === 'negative').length,
    }
    const avgRating = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0

    // Top concerns (extract keywords from negative/neutral feedback)
    const concernsText = feedback
      .filter(f => f.sentiment !== 'positive')
      .map(f => f.content.toLowerCase())
      .join(' ')
    const keywords = ['delay', 'shortage', 'communication', 'transparency', 'cost', 'schedule', 'quality', 'staff', 'supplies', 'planning']
    const concerns = keywords
      .map(k => ({ name: k, count: (concernsText.match(new RegExp(`\\b${k}\\b`, 'g')) || []).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      feedback,
      sentimentSummary,
      avgRating: Math.round(avgRating * 10) / 10,
      concerns,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Simple sentiment analysis based on rating
    const sentiment = body.rating >= 4 ? 'positive' : body.rating <= 2 ? 'negative' : 'neutral'

    const feedback = await db.feedback.create({
      data: {
        projectId: body.projectId || null,
        memberId: body.memberId || null,
        rating: parseInt(body.rating),
        category: body.category || 'general',
        content: body.content,
        sentiment,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'feedback',
        entityId: feedback.id,
        details: `New feedback submitted: ${feedback.rating} stars`,
      },
    })

    return NextResponse.json({ feedback })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body
    const feedback = await db.feedback.update({
      where: { id },
      data: { status },
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        entity: 'feedback',
        entityId: id,
        details: `Feedback marked as ${status}`,
      },
    })

    return NextResponse.json({ feedback })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}
