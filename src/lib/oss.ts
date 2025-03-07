import OSS from 'ali-oss';

const ossClient = new OSS({
  region: process.env.NEXT_PUBLIC_OSS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.NEXT_PUBLIC_OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.NEXT_PUBLIC_OSS_BUCKET,
});

export function getOssUrl(url: string): string {
  if (!url) return '';
  
  // 检查是否是OSS URL
  const ossPattern = /^https?:\/\/[\w-]+\.oss-[\w-]+\.aliyuncs\.com\//;
  if (!ossPattern.test(url)) {
    return url;
  }

  try {
    // 从完整URL中提取文件名
    const fileName = url.split('/').pop();
    if (!fileName) return url;

    // 生成签名URL（1小时有效期）
    return ossClient.signatureUrl(fileName, { expires: 3600 });
  } catch (error) {
    console.error('Generate OSS URL error:', error);
    return url;
  }
} 