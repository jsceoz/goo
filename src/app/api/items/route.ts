import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from 'crypto';
import { verifyAuth } from "@/lib/auth";

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

  console.log('Handling GET request for /api/items');
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    console.log('Request params:', { productId });

    const items = await prisma.item.findMany({
      where: {
        userId,
        ...(productId ? {
          productId: productId,
          quantity: { gt: 0 }, // 只返回有库存的记录
        } : {})
      },
      include: {
        product: true,
        cabinet: {
          include: {
            room: true
          },
        },
        brick: true,  // 包含分类信息
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found items:', items.length);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Fetch items error:', error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

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

  console.log('Handling POST request for /api/items');
  try {
    const data = await request.json();
    console.log('Request data:', data);
    
    // 生成条码
    const barcode = data.barcode || `NO_BARCODE_${randomUUID().slice(0, 8)}`;
    console.log('Using barcode:', barcode);
    
    // 先查找是否存在相同条码的商品
    let product = await prisma.product.findFirst({
      where: {
        barcode: barcode,
        userId: userId
      }
    });

    if (product) {
      // 如果存在，则更新
      product = await prisma.product.update({
        where: {
          id: product.id
        },
        data: {
          name: data.name,
          englishName: data.englishName,
          brand: data.brand,
          manufacturer: data.manufacturer,
          specification: data.specification,
          width: data.width,
          height: data.height,
          depth: data.depth,
          grossWeight: data.grossWeight,
          netWeight: data.netWeight,
          originCountry: data.originCountry,
          goodsType: data.goodsType,
          categoryCode: data.categoryCode,
          categoryName: data.categoryName,
          price: data.referencePrice ? parseFloat(data.referencePrice) : null,
          imageUrl: data.imageUrl,
          firstShipDate: data.firstShipDate,
          packagingType: data.packagingType,
          shelfLife: data.shelfLife,
          minSalesUnit: data.minSalesUnit,
          certificationStandard: data.certificationStandard,
          certificateLicense: data.certificateLicense,
          note: data.note,
          updatedAt: new Date(),
        }
      });
    } else {
      // 如果不存在，则创建新记录
      product = await prisma.product.create({
        data: {
          barcode: barcode,
          name: data.name,
          englishName: data.englishName,
          brand: data.brand,
          manufacturer: data.manufacturer,
          specification: data.specification,
          width: data.width,
          height: data.height,
          depth: data.depth,
          grossWeight: data.grossWeight,
          netWeight: data.netWeight,
          originCountry: data.originCountry,
          goodsType: data.goodsType,
          categoryCode: data.categoryCode,
          categoryName: data.categoryName,
          price: data.referencePrice ? parseFloat(data.referencePrice) : null,
          imageUrl: data.imageUrl,
          firstShipDate: data.firstShipDate,
          packagingType: data.packagingType,
          shelfLife: data.shelfLife,
          minSalesUnit: data.minSalesUnit,
          certificationStandard: data.certificationStandard,
          certificateLicense: data.certificateLicense,
          note: data.note,
          user: {
            connect: { id: userId }
          },
          updatedAt: new Date(),
        }
      });
    }
    console.log('Product created/updated:', product.id);

    // 转换日期格式
    const expirationDate = data.expirationDate 
      ? new Date(data.expirationDate + 'T00:00:00Z') 
      : null;

    // 创建库存记录
    console.log('Creating inventory record...');
    const item = await prisma.item.create({
      data: {
        product: {
          connect: {
            id: product.id  // 使用刚创建/更新的商品ID
          }
        },
        brick: {
          connect: {
            id: data.brickId
          }
        },
        cabinet: {
          connect: {
            id: data.cabinetId
          }
        },
        user: {
          connect: { id: userId }
        },
        quantity: parseInt(data.quantity),
        unit: data.unit,
        expirationDate,
        note: data.itemNote || '',
        updatedAt: new Date(),
      }
    });
    console.log('Inventory record created:', item.id);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create item',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}