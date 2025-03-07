import { NextRequest, NextResponse } from 'next/server';
import OSS from 'ali-oss';
import { generateMultimodalEmbedding } from '@/lib/doubao';
import { searchVectors } from '@/lib/dashvector';
import { addLog } from '@/lib/logger';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const source = 'api-search-image';

  // 验证用户身份
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: "未登录或无效的用户会话" },
      { status: 401 }
    );
  }
  const userId = authResult.userId;
  addLog('info', `用户 ${userId} 开始搜索图片`, source);

  try {
    addLog('info', '开始处理图片搜索请求', source);

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
    const { base64Data, topK = 5 } = await request.json();

    // 将base64转换为Buffer
    addLog('info', '转换base64数据为Buffer', source);
    const base64Content = base64Data.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');
    addLog('info', `文件大小: ${(buffer.length / 1024).toFixed(2)}KB`, source);

    // 生成文件名
    const fileName = `search_${Date.now()}.jpg`;
    addLog('info', `生成的文件名: ${fileName}`, source);

    // 上传到OSS
    addLog('info', '开始上传文件到OSS', source);
    const ossResult = await ossClient.put(fileName, buffer, {
      mime: 'image/jpeg'
    });
    addLog('success', '文件上传到OSS成功', source);

    // 生成可访问的OSS URL（有效期1小时）
    const ossUrl = ossClient.signatureUrl(fileName, { expires: 3600 });
    
    // 生成向量
    addLog('info', '开始生成图片向量', source);
    const embedding = await generateMultimodalEmbedding(ossUrl);
    addLog('success', '向量生成成功', source);

    // 搜索相似向量
    addLog('info', '开始搜索相似向量', source);
    const searchResult = await searchVectors(embedding, {
      filter: ''
    });

    // 检查返回结果
    if (searchResult.code !== 0 || !searchResult.output?.length) {
      addLog('info', '未找到相似图片', source);
      return NextResponse.json({
        found: false,
        message: searchResult.message || '未找到相似图片'
      });
    }

    // 按相似度排序（分数越小越相似）
    const sortedResults = [...searchResult.output].sort((a, b) => a.score - b.score);
    
    // 返回搜索结果
    addLog('success', `找到 ${sortedResults.length} 个相似图片`, source);

    console.log(sortedResults);
    return NextResponse.json({
      found: true,
      results: sortedResults.map((result: any) => ({
        id: result.id,
        score: result.score,
        ...result.fields
      }))
    });

  } catch (error) {
    console.error('图片搜索失败:', error);
    addLog('error', `图片搜索失败: ${error instanceof Error ? error.message : '未知错误'}`, source);
    return NextResponse.json(
      { error: '图片搜索失败' },
      { status: 500 }
    );
  }
}