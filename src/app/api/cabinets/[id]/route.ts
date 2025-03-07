import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 更新柜子
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 验证用户身份
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: "未登录或无效的用户会话" },
      { status: 401 }
    );
  }
  const userId = authResult.userId;

  try {
    const data = await request.json();
    const { id } = await params;

    // 验证房间是否存在且属于当前用户
    if (data.roomId) {
      const room = await prisma.room.findFirst({
        where: {
          id: data.roomId,
          user: {
            id: userId
          }
        }
      });

      if (!room) {
        return NextResponse.json(
          { error: '房间不存在或无权限' },
          { status: 400 }
        );
      }
    }

    const cabinet = await prisma.cabinet.update({
      where: {
        id,
        user: {
          id: userId
        }
      },
      data: {
        name: data.name,
        roomId: data.roomId,
        updatedAt: new Date()
      },
      include: {
        room: true,
        item: true
      }
    });

    return NextResponse.json(cabinet);
  } catch (error) {
    console.error('Error updating cabinet:', error);
    return NextResponse.json(
      { error: 'Failed to update cabinet' },
      { status: 500 }
    );
  }
}

// 删除柜子
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 验证用户身份
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: "未登录或无效的用户会话" },
      { status: 401 }
    );
  }
  const userId = authResult.userId;

  try {
    const { id } = await params;
    // 检查柜子中是否有物品
    const cabinet = await prisma.cabinet.findFirst({
      where: {
        id,
        user: {
          id: userId
        }
      },
      include: {
        item: true
      }
    });

    if (!cabinet) {
      return NextResponse.json(
        { error: '柜子不存在或无权限' },
        { status: 404 }
      );
    }

    if (cabinet.item.length > 0) {
      return NextResponse.json(
        { error: '该位置中还有物品，无法删除' },
        { status: 400 }
      );
    }

    await prisma.cabinet.delete({
      where: {
        id,
        user: {
          id: userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cabinet:', error);
    return NextResponse.json(
      { error: 'Failed to delete cabinet' },
      { status: 500 }
    );
  }
} 