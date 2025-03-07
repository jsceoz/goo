import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('Handling GET request for /api/categories/classes')
  
  const { searchParams } = new URL(request.url)
  const familyId = searchParams.get('familyId')
  console.log('Request params:', { familyId })

  if (!familyId) {
    console.log('Missing required parameter: familyId')
    return NextResponse.json({ error: 'familyId is required' }, { status: 400 })
  }

  try {
    console.log('Fetching classes for familyId:', familyId)
    const classes = await prisma.renamedclass.findMany({
      where: { familyId },
      select: {
        id: true,
        code: true,
        name: true,
      }
    })
    console.log('Classes found:', classes.length)
    console.log('Classes data:', JSON.stringify(classes, null, 2))
    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch classes',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 