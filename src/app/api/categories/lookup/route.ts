import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('Handling GET request for /api/categories/lookup')
  const { searchParams } = new URL(request.url)
  const categoryCode = searchParams.get('code')
  console.log('Request params:', { categoryCode })

  if (!categoryCode) {
    console.log('Missing required parameter: categoryCode')
    return NextResponse.json({ error: 'Category code is required' }, { status: 400 })
  }

  try {
    console.log('Looking up brick with code:', categoryCode)
    // 先找到 Brick
    const brick = await prisma.brick.findFirst({
      where: { code: categoryCode },
      include: {
        Renamedclass: {
          include: {
            family: {
              include: {
                segment: true
              }
            }
          }
        }
      }
    })

    if (!brick) {
      console.log('Brick not found for code:', categoryCode)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    console.log('Found brick:', brick)

    // 构建分类路径
    const categoryPath = {
      segment: {
        id: brick.Renamedclass.family.segment.id,
        code: brick.Renamedclass.family.segment.code,
        name: brick.Renamedclass.family.segment.name,
      },
      family: {
        id: brick.Renamedclass.family.id,
        code: brick.Renamedclass.family.code,
        name: brick.Renamedclass.family.name,
      },
      class: {
        id: brick.Renamedclass.id,
        code: brick.Renamedclass.code,
        name: brick.Renamedclass.name,
      },
      brick: {
        id: brick.id,
        code: brick.code,
        name: brick.name,
      }
    }

    console.log('Constructed category path:', categoryPath)
    return NextResponse.json(categoryPath)
  } catch (error) {
    console.error('Error fetching category path:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch category path',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 