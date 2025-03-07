import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringItems = await prisma.item.findMany({
      where: {
        expirationDate: {
          not: null,
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        product: {
          select: {
            name: true,
            imageUrl: true,
          }
        },
        cabinet: {
          select: {
            name: true,
            room: {
              select: {
                name: true
              }
            }
          }
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    return NextResponse.json(expiringItems);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    return NextResponse.json(
      { error: "Failed to fetch expiring items" },
      { status: 500 }
    );
  }
}