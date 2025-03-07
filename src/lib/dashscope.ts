// 阿里云百炼平台API配置
export const DASHSCOPE_APP_ID = '';
export const DASHSCOPE_API_KEY = '';

// 智能分类API
export async function getSmartCategory(productName: string) {
  console.log('开始智能分类请求，商品名称:', productName);
  try {
    const requestBody = {
      input: {
        prompt: productName
      },
      parameters: {},
      debug: {}
    };
    console.log('智能分类请求参数:', JSON.stringify(requestBody));

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/${DASHSCOPE_APP_ID}/completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('智能分类请求失败，状态码:', response.status);
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      throw new Error(`智能分类请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('智能分类响应数据:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('智能分类错误:', error);
    throw error;
  }
}

// 智能识别API
export async function getImageRecognition(fileId: string) {
  console.log('开始智能识别请求，文件ID:', fileId);
  try {
    const requestBody = {
      input: {
        prompt: '请识别图片内容，并按照指定的JSON格式输出'
      },
      parameters: {
        rag_options: {
          session_file_ids: [fileId]
        }
      },
      debug: {}
    };
    console.log('智能识别请求参数:', JSON.stringify(requestBody));

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/f59eb43b25d349af95543f1a1e6d3b84/completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('智能识别请求失败，状态码:', response.status);
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      throw new Error(`智能识别请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('智能识别响应数据:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('智能识别错误:', error);
    throw error;
  }
}

// 智能识别保质期API
export async function getExpirationRecognition(fileId: string) {
  console.log('开始识别保质期，文件ID:', fileId);
  try {
    const requestBody = {
      input: {
        prompt: '识别'
      },
      parameters: {
        rag_options: {
          session_file_ids: [fileId]
        }
      },
      debug: {}
    };
    console.log('保质期识别请求参数:', JSON.stringify(requestBody));

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/925d3e4db2f34a009e66f7368f4c4cef/completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('保质期识别请求失败，状态码:', response.status);
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      throw new Error(`保质期识别请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('保质期识别响应数据:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('保质期识别错误:', error);
    throw error;
  }
}

// 智能识别生产日期API
export async function getProductionDateRecognition(fileId: string) {
  console.log('开始识别生产日期，文件ID:', fileId);
  try {
    const requestBody = {
      input: {
        prompt: '识别'
      },
      parameters: {
        rag_options: {
          session_file_ids: [fileId]
        }
      },
      debug: {}
    };
    console.log('生产日期识别请求参数:', JSON.stringify(requestBody));

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/7f7aefcee5ff41f3bbdbb77b20a6f839/completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('生产日期识别请求失败，状态码:', response.status);
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      throw new Error(`生产日期识别请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('生产日期识别响应数据:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('生产日期识别错误:', error);
    throw error;
  }
}