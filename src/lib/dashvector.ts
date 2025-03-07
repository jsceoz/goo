import { addLog } from '@/lib/logger';

const DASHVECTOR_API_KEY = '';
const BASE_URL = '';

interface DashvectorDoc {
  id: string;
  vector: number[];
  fields?: Record<string, any>;
}

export async function upsertVector(doc: DashvectorDoc) {
  try {
    addLog('info', '开始上传向量到Dashvector', 'dashvector');
    
    const response = await fetch(`${BASE_URL}/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dashvector-auth-token': DASHVECTOR_API_KEY
      },
      body: JSON.stringify({
        docs: [doc]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('向量上传失败:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`上传失败: ${errorData.message || response.statusText}`);
    }

    const data: DashvectorResponse = await response.json();

    console.log('向量上传成功:', data);
    
    if (data.code !== 0) {
      console.error('向量服务返回错误:', data);
      throw new Error(data.message || `向量服务返回错误码: ${data.code}`);
    }

    addLog('success', '向量上传成功', 'dashvector');
    return data;
    
  } catch (error) {
    addLog('error', `向量上传失败: ${error instanceof Error ? error.message : '未知错误'}`, 'dashvector');
    throw error;
  }
}

interface QueryOptions {
  topK?: number;
  include_vector?: boolean;
  filter?: Record<string, any>;
}

interface DashvectorSearchResult {
  code: number;
  request_id: string;
  message: string;
  output: Array<{
    id: string;
    score: number;
    fields: {
      imageUrl: string;
      name?: string;
      productId?: string;
      [key: string]: any;
    };
  }>;
}

export async function searchVectors(vector: number[], options: QueryOptions = {}): Promise<DashvectorSearchResult> {
  try {
    addLog('info', '开始向量相似搜索', 'dashvector');
    
    const response = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dashvector-auth-token': DASHVECTOR_API_KEY
      },
      body: JSON.stringify({
        vector,
        topk: options.topK || 5,
        include_vector: false,
        filter: options.filter
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`搜索失败: ${errorData.message || response.statusText}`);
    }

    const data: DashvectorSearchResult = await response.json();
    
    if (data.code !== 0) {
      throw new Error(data.message || `向量搜索失败: ${data.code}`);
    }

    addLog('success', '向量搜索成功', 'dashvector');
    return data;
    
  } catch (error) {
    addLog('error', `向量搜索失败: ${error instanceof Error ? error.message : '未知错误'}`, 'dashvector');
    throw error;
  }
}

// 类型定义
interface DashvectorResponse {
  code: number;
  data?: any;
  message: string;
  request_id: string;
}