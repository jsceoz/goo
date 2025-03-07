import { NextRequest, NextResponse } from 'next/server';
import OSS from 'ali-oss';
import { getDoubaoExpirationRecognition } from '@/lib/doubao';
import { addLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const source = 'api-expiration';
  try {
    addLog('info', '开始处理保质期识别请求', source);

    // 初始化OSS客户端
    const ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET,
    });

    // 获取请求中的base64图片数据
    const { base64Data } = await request.json();
    const base64Content = base64Data.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');

    // 上传到OSS
    const fileName = `${Date.now()}-expiration.jpg`;
    const ossResult = await ossClient.put(fileName, buffer, {
      mime: 'image/jpeg'
    });

    // 生成可访问的OSS URL
    const ossUrl = ossClient.signatureUrl(fileName, { expires: 3600 });
    
    // 调用豆包服务
    const recognition = await getDoubaoExpirationRecognition(ossUrl);

    return NextResponse.json({
      url: ossResult.url,
      recognition
    });

  } catch (error) {
    addLog('error', `保质期识别失败: ${error instanceof Error ? error.message : '未知错误'}`, source);
    return NextResponse.json(
      { error: '保质期识别失败' },
      { status: 500 }
    );
  }
}