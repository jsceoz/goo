import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
    const { itemId, quantity } = data;

    // 转换数量为整数
    const outQuantity = parseInt(quantity);
    if (isNaN(outQuantity) || outQuantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    // 获取当前库存，并验证是否属于当前用户
    const item = await prisma.item.findFirst({
      where: { 
        id: itemId,
        userId: userId
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or no permission" },
        { status: 404 }
      );
    }

    if (item.quantity < outQuantity) {
      return NextResponse.json(
        { error: "Insufficient quantity" },
        { status: 400 }
      );
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新库存
      const updatedItem = await tx.item.update({
        where: { 
          id: itemId,
          userId: userId
        },
        data: {
          quantity: item.quantity - outQuantity,
          updatedAt: new Date()
        },
      });

      // 创建出库记录
      await tx.inventorylog.create({
        data: {
          type: 'OUT',
          quantity: outQuantity,
          item: {
            connect: {
              id: itemId
            }
          },
          user: {
            connect: {
              id: userId
            }
          }
        },
      });

      return updatedItem;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Out stock error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process out stock" },
      { status: 500 }
    );
  }
} 