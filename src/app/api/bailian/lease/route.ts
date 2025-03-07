import { BailianClient } from '@/lib/bailian';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { fileName, md5, sizeInBytes } = await request.json();

    if (!fileName || !md5 || !sizeInBytes) {
      return NextResponse.json(
        { error: '缺少必要参数：fileName、md5、sizeInBytes' },
        { status: 400 }
      );
    }

    const client = BailianClient.getInstance();
    const response = await client.applyFileUploadLease(fileName, md5, sizeInBytes);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('文件上传租约申请失败:', error.message);
    return NextResponse.json(
      { error: error.message || '租约申请失败' },
      { status: 500 }
    );
  }
}