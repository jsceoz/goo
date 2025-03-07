import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '无效的手机号' },
        { status: 400 }
      );
    }

    // 超级验证码检查
    const superCode = '886655';
    let verificationRecord = null;
    
    if (code !== superCode) {
      // 正常验证码流程
      verificationRecord = await prisma.verificationcode.findFirst({
        where: {
          phone,
          code,
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      if (!verificationRecord) {
        return NextResponse.json(
          { error: '验证码无效或已过期' },
          { status: 400 }
        );
      }
    }

    // 只在正常验证码流程中删除验证码记录
    if (code !== superCode && verificationRecord) {
      await prisma.verificationcode.delete({
        where: {
          id: verificationRecord.id
        }
      });
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { 
          id: randomUUID(),
          phone,
          updatedAt: new Date()
        }
      });
    }

    // 生成 JWT token
    const token = await new jose.SignJWT({ userId: user.id, phone: user.phone })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // 创建响应对象
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      }
    });

    // 设置 cookie
    const cookieStore = await cookies();
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('验证失败:', error);
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}