import { NextRequest, NextResponse } from 'next/server';
import OSS from 'ali-oss';
import { getDoubaoRecognition, generateMultimodalEmbedding } from '@/lib/doubao';
import { addLog } from '@/lib/logger';
import { upsertVector } from '@/lib/dashvector';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const source = 'api-upload';
  
  // 验证用户身份
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: "未登录或无效的用户会话" },
      { status: 401 }
    );
  }
  const userId = authResult.userId;
  addLog('info', `用户 ${userId} 开始上传文件`, source);

  try {
    addLog('info', '开始处理文件上传请求', source);

    // 初始化OSS客户端
    addLog('info', '初始化OSS客户端', source);
    const ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET,
    });

    // 获取请求中的base64图片数据
    addLog('info', '解析请求数据', source);
    const { base64Data } = await request.json();

    // 将base64转换为Buffer
    addLog('info', '转换base64数据为Buffer', source);
    const base64Content = base64Data.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');
    addLog('info', `文件大小: ${(buffer.length / 1024).toFixed(2)}KB`, source);

    // 生成文件名
    const fileName = `${Date.now()}.jpg`;
    addLog('info', `生成的文件名: ${fileName}`, source);

    // 先上传到OSS
    addLog('info', '开始上传文件到OSS', source);
    const ossResult = await ossClient.put(fileName, buffer, {
      mime: 'image/jpeg'
    });
    addLog('success', '文件上传到OSS成功', source);

    // 生成可访问的OSS URL（有效期1小时）
    const ossUrl = ossClient.signatureUrl(fileName, { expires: 3600 });
    
    // 调用豆包服务
    addLog('info', '开始调用豆包识别服务', source);
    const doubaoResult = await getDoubaoRecognition(ossUrl);
    
    // 新增状态码检查
    if (doubaoResult.status !== 0) {
      throw new Error(doubaoResult.msg || '商品识别失败');
    }

    // 生成向量并存储
    try {
      addLog('info', '开始生成图片向量', source);
      const embedding = await generateMultimodalEmbedding(ossUrl);
      
      await upsertVector({
        id: `item_${Date.now()}`,
        vector: embedding,
        fields: {
          name: doubaoResult.productName,
          imageUrl: ossResult.url,
          userId: userId
        }
      })
        .then(() => addLog('success', '向量存储成功', source))
        .catch(error => {
          addLog('error', `向量存储失败: ${error.message}`, source);
        });

    } catch (error) {
      addLog('error', `向量处理失败: ${error}`, source);
    }

    // 返回处理结果
    addLog('success', '请求处理完成', source);
    return NextResponse.json({
      url: ossResult.url,
      recognition: doubaoResult
    });

  } catch (error) {
    console.error('文件处理失败:', error);
    addLog('error', `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`, source);
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    );
  }
}