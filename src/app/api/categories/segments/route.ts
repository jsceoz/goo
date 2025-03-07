import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      }
    })
    return NextResponse.json(segments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
  }
}