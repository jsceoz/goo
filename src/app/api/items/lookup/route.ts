import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

interface BarcodeApiResponse {
  code: number;
  msg: string;
  data: {
    barcode: string;
    brand: string;
    goods_name: string;
    company: string;
    keyword: string;
    goods_type: string;
    category_code: string;
    category_name: string;
    image: string;
    spec: string;
    width: string;
    height: string;
    depth: string;
    gross_weight: string;
    net_weight: string;
    price: string;
    origin_country: string;
    first_ship_date: string;
    packaging_type: string;
    shelf_life: string;
    min_sales_unit: string;
    certification_standard: string;
    certificate_license: string;
    remark: string;
  }
}

const APPCODE = '641e5cf2757b4dd8978f2194a3a26bdf';

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

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const imageUrl = searchParams.get('imageUrl');

  if (!barcode && !imageUrl) {
    return NextResponse.json(
      { error: "Barcode or imageUrl is required" },
      { status: 400 }
    );
  }

  try {
    // 先查找本地商品数据
    let existingProduct;
    if (barcode) {
      console.log('开始查询本地商品数据，条码:', barcode);
      existingProduct = await prisma.product.findFirst({
        where: { 
          barcode,
          user: {
            id: userId
          }
        },
        include: {
          item: {
            where: {
              user: {
                id: userId
              }
            },
            include: {
              brick: true,
              cabinet: {
                include: {
                  room: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });
    } else if (imageUrl) {
      console.log('开始查询本地商品数据，图片URL:', imageUrl);
      existingProduct = await prisma.product.findFirst({
        where: { 
          imageUrl,
          user: {
            id: userId
          }
        },
        include: {
          item: {
            where: {
              user: {
                id: userId
              }
            },
            include: {
              brick: true,
              cabinet: {
                include: {
                  room: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });
    }

    if (existingProduct) {
      console.log('找到本地商品数据');
      const lastItem = existingProduct.item[0];
      
      return NextResponse.json({
        found: true,
        product: {
          ...existingProduct,
          item: undefined
        },
        lastItem: lastItem ? {
          unit: lastItem.unit,
          cabinetId: lastItem.cabinet.id,
          brickId: lastItem.brick.id
        } : null
      });
    }

    // 如果是图片URL查询且未找到商品，直接返回未找到
    if (imageUrl) {
      return NextResponse.json({ found: false });
    }

    // 调用阿里云 API
    console.log('未找到本地商品数据，开始调用阿里云API查询，条码:', barcode);
    const apiResponse = await fetch(
      `https://tsbarcode.market.alicloudapi.com/barcode/index?barcode=${barcode}`,
      {
        headers: {
          'Authorization': `APPCODE ${APPCODE}`,
        },
      }
    );

    if (!apiResponse.ok) {
      console.error('阿里云API请求失败:', apiResponse.status, apiResponse.statusText);
      throw new Error('商品查询服务异常');
    }

    const data: BarcodeApiResponse = await apiResponse.json();
    console.log('阿里云API响应数据:', JSON.stringify(data, null, 2));
    
    if (data.code !== 1) {
      console.error('阿里云API返回错误:', data.msg);
      throw new Error(data.msg || '商品查询失败');
    }

    const barcodeData = data.data;

    // 根据分类编码查找对应的Brick记录
    console.log('根据分类编码查找Brick:', barcodeData.category_code);
    let matchedBrick = null;
    if (barcodeData.category_code) {
      matchedBrick = await prisma.brick.findFirst({
        where: { code: barcodeData.category_code }
      });
    }

    // 获取默认分类和位置
    console.log('开始获取默认分类和位置');
    let defaultBrick = matchedBrick || await prisma.brick.findFirst();
    
    // 获取默认房间和柜子
    const defaultRoom = await prisma.room.findFirst({
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
          take: 1
        }
      }
    });

    let defaultCabinet = defaultRoom?.cabinets[0];

    if (!defaultRoom || !defaultCabinet) {
      console.log('未找到默认位置，开始创建...');
      const createdRoom = await prisma.room.create({
        data: {
          name: '默认房间',
          user: {
            connect: { id: userId }
          },
          updatedAt: new Date(),
          cabinets: {
            create: [{
              name: '默认位置',
              user: {
                connect: { id: userId }
              },
              updatedAt: new Date()
            }]
          }
        },
        include: {
          cabinets: true
        }
      });
      defaultCabinet = createdRoom.cabinets[0];
    }

    // 从规格中提取单位
    console.log('从规格中提取单位:', barcodeData.spec);
    const unitMatch = barcodeData.spec?.match(/\d+(\.\d+)?([a-zA-Z]+|个|包|瓶|盒)/);
    const defaultUnit = unitMatch?.[2] || "个";
    console.log('提取的单位:', defaultUnit);

    // 构建商品数据
    console.log('开始构建商品数据');
    // 创建新商品记录
    const newProduct = await prisma.product.create({
      data: {
        name: barcodeData.goods_name || "",
        barcode: barcodeData.barcode || "",
        brand: barcodeData.brand || "",
        manufacturer: barcodeData.company || "",
        specification: barcodeData.spec || "",
        width: barcodeData.width || "",
        height: barcodeData.height || "",
        depth: barcodeData.depth || "",
        grossWeight: barcodeData.gross_weight || "",
        netWeight: barcodeData.net_weight || "",
        originCountry: barcodeData.origin_country || "",
        goodsType: barcodeData.goods_type || "",
        categoryCode: barcodeData.category_code || "",
        categoryName: barcodeData.category_name || "",
        price: barcodeData.price ? parseFloat(barcodeData.price) : null,
        imageUrl: barcodeData.image || "",
        firstShipDate: barcodeData.first_ship_date || "",
        packagingType: barcodeData.packaging_type || "",
        shelfLife: barcodeData.shelf_life || "",
        minSalesUnit: barcodeData.min_sales_unit || "",
        certificationStandard: barcodeData.certification_standard || "",
        certificateLicense: barcodeData.certificate_license || "",
        note: barcodeData.remark || "",
        user: {
          connect: { id: userId }
        },
        updatedAt: new Date()
      }
    });

    const productData = {
      ...newProduct,
      referencePrice: newProduct.price?.toString() || "",
    };

    console.log('返回商品数据:', JSON.stringify(productData, null, 2));

    return NextResponse.json({
      found: true,
      product: productData,
      defaultItem: defaultCabinet ? {
        brickId: defaultBrick?.id || null,
        cabinetId: defaultCabinet.id,
        unit: defaultUnit,
      } : null,
    });

  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup product' },
      { status: 500 }
    );
  }
}