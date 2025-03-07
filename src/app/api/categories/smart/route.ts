import { NextRequest, NextResponse } from 'next/server';
import { getDoubaoCategoryRecognition } from '@/lib/doubao';
import { addLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const source = 'api-category-smart';
  try {
    addLog('info', '开始处理智能分类请求', source);
    
    const { productName } = await request.json();
    
    if (!productName) {
      throw new Error('缺少商品名称参数');
    }

    const recognition = await getDoubaoCategoryRecognition(productName);
    
    if (recognition.status !== 0 || !recognition.code) {
      throw new Error(recognition.msg || '分类识别结果无效');
    }

    return NextResponse.json({
      status: recognition.status,
      code: recognition.code,
      name: recognition.name || recognition.category,
      message: recognition.msg
    });

  } catch (error) {
    addLog('error', `智能分类失败: ${error instanceof Error ? error.message : '未知错误'}`, source);
    return NextResponse.json(
      { error: '智能分类失败' },
      { status: 500 }
    );
  }
}