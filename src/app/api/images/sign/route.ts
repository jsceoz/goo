import { NextResponse } from 'next/server';
import OSS from 'ali-oss';

export async function GET(request: Request) {
  try {
    // 从URL参数中获取objectKey
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // 创建OSS客户端
    const client = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET,
    });

    // 生成签名URL，有效期1小时
    const url = await client.signatureUrl(key, {
      expires: 3600,
    });

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}