import { NextResponse } from 'next/server';
import { version } from '../../../../package.json';

export async function GET() {
  try {
    const systemInfo = {
      version,
      nodeEnv: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime())
    };

    return NextResponse.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json(
      { error: '获取系统信息失败' },
      { status: 500 }
    );
  }
}