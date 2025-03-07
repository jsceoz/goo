import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const segmentId = searchParams.get('segmentId')

  if (!segmentId) {
    return NextResponse.json({ error: 'segmentId is required' }, { status: 400 })
  }

  try {
    const families = await prisma.family.findMany({
      where: { segmentId },
      select: {
        id: true,
        code: true,
        name: true,
      }
    })
    return NextResponse.json(families)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch families' }, { status: 500 })
  }
} 