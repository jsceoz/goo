import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 获取分类列表
export async function GET(request: Request) {
  // 验证用户身份
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: "未登录或无效的用户会话" },
      { status: 401 }
    );
  }

  try {
    const bricks = await prisma.brick.findMany({
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
      },
      orderBy: {
        code: 'asc'
      }
    });

    // 格式化返回数据，添加完整分类路径和层级信息
    const formattedBricks = bricks.map(brick => ({
      id: brick.id,
      code: brick.code,
      name: brick.name,
      fullPath: `${brick.Renamedclass.family.segment.name} > ${brick.Renamedclass.family.name} > ${brick.Renamedclass.name} > ${brick.name}`,
      definition: brick.definition,
      classId: brick.classId,
      createdAt: brick.createdAt,
      updatedAt: brick.updatedAt,
      // 添加层级信息
      hierarchy: {
        segment: {
          id: brick.Renamedclass.family.segment.id,
          code: brick.Renamedclass.family.segment.code,
          name: brick.Renamedclass.family.segment.name
        },
        family: {
          id: brick.Renamedclass.family.id,
          code: brick.Renamedclass.family.code,
          name: brick.Renamedclass.family.name
        },
        class: {
          id: brick.Renamedclass.id,
          code: brick.Renamedclass.code,
          name: brick.Renamedclass.name
        },
        brick: {
          id: brick.id,
          code: brick.code,
          name: brick.name
        }
      }
    }));

    // 构建分类树
    const categoryTree = formattedBricks.reduce((acc, brick) => {
      const { segment, family, class: cls } = brick.hierarchy;
      
      // 添加段
      if (!acc[segment.id]) {
        acc[segment.id] = {
          id: segment.id,
          code: segment.code,
          name: segment.name,
          level: 1,
          children: {}
        };
      }
      
      // 添加族
      if (!acc[segment.id].children[family.id]) {
        acc[segment.id].children[family.id] = {
          id: family.id,
          code: family.code,
          name: family.name,
          level: 2,
          parentId: segment.id,
          children: {}
        };
      }
      
      // 添加类
      if (!acc[segment.id].children[family.id].children[cls.id]) {
        acc[segment.id].children[family.id].children[cls.id] = {
          id: cls.id,
          code: cls.code,
          name: cls.name,
          level: 3,
          parentId: family.id,
          children: {}
        };
      }

      return acc;
    }, {} as any);

    return NextResponse.json({
      items: formattedBricks,
      tree: categoryTree
    });
  } catch (error) {
    console.error('Error fetching bricks:', error);
    return NextResponse.json(
      { error: "Failed to fetch bricks" },
      { status: 500 }
    );
  }
}