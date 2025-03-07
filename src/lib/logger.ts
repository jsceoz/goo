// 定义日志类型
export interface Log {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: string;
  source: string;
}

// 内存中存储日志的数组
let logs: Log[] = [];

// 添加日志的函数
export function addLog(
  type: 'info' | 'error' | 'success',
  message: string,
  source: string
) {
  const timestamp = new Date().toISOString();
  const newLog = { type, message, timestamp, source };

  // 服务端打印日志
  console.log(`[${type.toUpperCase()}] ${source}: ${message} (${timestamp})`);

  // 查找是否存在来自同一来源的日志
  const existingLogIndex = logs.findIndex(log => log.source === source);
  
  if (existingLogIndex !== -1) {
    // 如果存在同一来源的日志，替换它
    logs[existingLogIndex] = newLog;
  } else {
    // 如果不存在，添加新日志
    logs.push(newLog);
  }
  
  // 只保留最近的50条日志
  if (logs.length > 50) {
    logs = logs.slice(-50);
  }
}

// 获取日志的函数
export function getLogs() {
  return [...logs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}