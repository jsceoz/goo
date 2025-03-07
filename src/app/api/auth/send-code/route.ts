import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '无效的手机号' },
        { status: 400 }
      );
    }

    // 生成6位随机验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置过期时间为5分钟后
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 删除该手机号的旧验证码
    await prisma.verificationcode.deleteMany({
      where: { phone }
    });

    // 保存新的验证码
    await prisma.verificationcode.create({
      data: {
        id: randomUUID(),
        phone,
        code: verificationCode,
        expiresAt
      }
    });

    // TODO: 集成短信服务发送验证码
    console.log(`验证码 ${verificationCode} 已发送到手机号 ${phone}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
} 