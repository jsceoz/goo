import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 更新房间
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

    const room = await prisma.room.update({
      where: {
        id,
        user: {
          id: userId
        }
      },
      data: {
        name: data.name,
        updatedAt: new Date()
      }
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// 删除房间
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
    // 检查是否有关联的柜子
    const cabinets = await prisma.cabinet.findMany({
      where: {
        roomId: id,
        user: {
          id: userId
        }
      },
      include: {
        item: true
      }
    });

    // 检查柜子中是否有物品
    const hasItems = cabinets.some(cabinet => cabinet.item.length > 0);
    if (hasItems) {
      return NextResponse.json(
        { error: '该房间下的位置中还有物品，无法删除' },
        { status: 400 }
      );
    }

    // 先删除所有柜子，再删除房间
    await prisma.$transaction([
      prisma.cabinet.deleteMany({
        where: {
          roomId: id,
          user: {
            id: userId
          }
        }
      }),
      prisma.room.delete({
        where: {
          id,
          user: {
            id: userId
          }
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
} 