import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 获取房间列表
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

  console.log('Fetching rooms for user:', userId);
  try {
    const rooms = await prisma.room.findMany({
      where: {
        user: {
          id: userId
        }
      },
      include: {
        cabinets: {
          where: {
            user: {
              id: userId
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    console.log('Rooms fetched successfully:', rooms.length);
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// 创建房间
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
    const room = await prisma.room.create({
      data: {
        name: data.name,
        user: {
          connect: { id: userId }
        },
        updatedAt: new Date()
      }
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}