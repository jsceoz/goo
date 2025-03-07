import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')

  if (!classId) {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 })
  }

  try {
    const bricks = await prisma.brick.findMany({
      where: { classId },
      select: {
        id: true,
        code: true,
        name: true,
      }
    })
    return NextResponse.json(bricks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bricks' }, { status: 500 })
  }
} 