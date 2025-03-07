import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/logger';

// GET 接口处理函数
export async function GET() {
  try {
    // 使用getLogs函数获取日志数据
    const recentLogs = getLogs();
    
    return NextResponse.json(recentLogs);
  } catch (error) {
    console.error('获取日志失败:', error);
    return NextResponse.json(
      { error: '获取日志失败' },
      { status: 500 }
    );
  }
}