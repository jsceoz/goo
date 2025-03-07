import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// 获取单个物品
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        product: true,
        cabinet: {
          include: {
            room: true
          }
        },
        brick: true
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: "物品不存在或无权限访问" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

// 更新物品
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    // 验证物品是否存在且属于当前用户
    const existingItem = await prisma.item.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        product: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "物品不存在或无权限修改" },
        { status: 404 }
      );
    }

    // 更新商品信息
    await prisma.product.update({
      where: {
        id: existingItem.product.id
      },
      data: {
        name: data.name,
        barcode: data.barcode,
        brand: data.brand,
        specification: data.specification,
        updatedAt: new Date()
      }
    });

    // 更新物品信息
    const updatedItem = await prisma.item.update({
      where: {
        id: params.id
      },
      data: {
        quantity: parseInt(data.quantity),
        unit: data.unit,
        cabinetId: data.cabinetId,
        brickId: data.brickId,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        note: data.note,
        updatedAt: new Date()
      },
      include: {
        product: true,
        cabinet: {
          include: {
            room: true
          }
        },
        brick: true
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// 删除物品
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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
    // 验证物品是否存在且属于当前用户
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        userId
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: "物品不存在或无权限删除" },
        { status: 404 }
      );
    }

    // 删除物品
    await prisma.item.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
} 