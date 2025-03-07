import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 获取柜子列表
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const cabinets = await prisma.cabinet.findMany({
      where: {
        roomId: roomId || undefined,
        user: {
          id: userId
        }
      },
      include: {
        room: true,
        item: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(cabinets);
  } catch (error) {
    console.error('Error fetching cabinets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cabinets' },
      { status: 500 }
    );
  }
}

// 创建新柜子
export async function POST(request: Request) {
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
    
    // 验证房间是否存在且属于当前用户
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

    const cabinet = await prisma.cabinet.create({
      data: {
        name: data.name,
        user: {
          connect: {
            id: userId
          }
        },
        room: {
          connect: {
            id: data.roomId
          }
        },
        updatedAt: new Date()
      },
      include: {
        room: true
      }
    });

    return NextResponse.json(cabinet);
  } catch (error) {
    console.error('Error creating cabinet:', error);
    return NextResponse.json(
      { error: 'Failed to create cabinet' },
      { status: 500 }
    );
  }
} 