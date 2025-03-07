import { addLog } from '@/lib/logger';

interface DoubaoResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
  request_id: string;
}

export async function getDoubaoRecognition(imageUrl: string) {
  const API_KEY = '';
  const ENDPOINT_ID = '';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';

  try {
    addLog('info', '开始调用豆包商品识别服务', 'doubao-service');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别商品信息"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DoubaoResponse = await response.json();
    addLog('success', '豆包服务调用成功', 'doubao-service');
    
    // 解析返回内容
    const resultText = data.choices[0]?.message?.content || '';
    try {
      const cleanedText = resultText.replace(/```json\n|\n```/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      throw new Error('解析豆包返回结果失败');
    }
    
  } catch (error) {
    addLog('error', `豆包服务调用失败: ${error instanceof Error ? error.message : '未知错误'}`, 'doubao-service');
    throw error;
  }
}

// 新增保质期识别函数
export async function getDoubaoExpirationRecognition(imageUrl: string) {
  const API_KEY = '';
  const ENDPOINT_ID = '';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';

  try {
    addLog('info', '开始调用豆包保质期识别服务', 'doubao-service');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别保质期信息，返回指定JSON格式"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DoubaoResponse = await response.json();
    addLog('success', '豆包保质期识别成功', 'doubao-service');
    
    // 解析返回内容
    const resultText = data.choices[0]?.message?.content || '';
    try {
      const cleanedText = resultText.replace(/```json\n|\n```/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('保质期识别原始返回:', resultText);
      addLog('error', `保质期解析失败，内容截取: ${resultText.substring(0, 150)}`, 'doubao-service');
      throw new Error('解析保质期结果失败');
    }
    
  } catch (error) {
    addLog('error', `豆包保质期识别失败: ${error instanceof Error ? error.message : '未知错误'}`, 'doubao-service');
    throw error;
  }
}

// 新增生产日期识别函数
export async function getDoubaoProductionDateRecognition(imageUrl: string) {
  const API_KEY = '';
  const ENDPOINT_ID = '';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';

  try {
    addLog('info', '开始调用豆包生产日期识别服务', 'doubao-service');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别生产日期信息，返回JSON格式：{status: 0, productionDate: 'YYYY-MM-DD', msg: ''}。status为0表示成功，非0时msg填写错误信息"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DoubaoResponse = await response.json();
    addLog('success', '豆包生产日期识别成功', 'doubao-service');
    
    // 解析返回内容
    const resultText = data.choices[0]?.message?.content || '';
    try {
      const cleanedText = resultText.replace(/```json\n|\n```/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('生产日期识别原始数据:', resultText);
      addLog('error', `生产日期解析异常，原始响应: ${resultText.slice(0, 180)}`, 'doubao-service');
      throw new Error('解析生产日期结果失败');
    }
    
  } catch (error) {
    addLog('error', `豆包生产日期识别失败: ${error instanceof Error ? error.message : '未知错误'}`, 'doubao-service');
    throw error;
  }
}

// 修改商品分类识别函数为基于文本
export async function getDoubaoCategoryRecognition(productName: string) {
  const API_KEY = '';
  const ENDPOINT_ID = '';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';

  try {
    addLog('info', '开始调用豆包商品分类服务', 'doubao-service');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        messages: [
          {
            role: "user",
            content: productName
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DoubaoResponse = await response.json();
    addLog('success', '豆包分类识别成功', 'doubao-service');
    
    // 解析返回内容
    const resultText = data.choices[0]?.message?.content || '';

    try {
      const cleanedText = resultText.replace(/```json\n|\n```/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('原始返回内容:', resultText);
      addLog('error', `解析失败，原始内容: ${resultText.slice(0, 200)}...`, 'doubao-service');
      throw new Error('解析分类结果失败');
    }
    
  } catch (error) {
    addLog('error', `商品分类识别失败: ${error instanceof Error ? error.message : '未知错误'}`, 'doubao-service');
    throw error;
  }
}

// 新增多模态向量生成函数
export async function generateMultimodalEmbedding(imageUrl: string) {
  const API_KEY = '';
  const ENDPOINT_ID = '';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal';

  try {
    addLog('info', '开始生成多模态向量', 'doubao-embedding');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        input: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    addLog('success', '多模态向量生成成功', 'doubao-embedding');
    
    // 验证返回数据结构
    if (!data?.data?.embedding) {
      throw new Error('无效的向量返回格式');
    }

    return data.data.embedding as number[];

  } catch (error) {
    addLog('error', `多模态向量生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'doubao-embedding');
    throw error;
  }
}

// 新增接口类型定义
interface MultimodalEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  request_id: string;
} 