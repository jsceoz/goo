'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface LogMessage {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: string;
  source: string;
}

// 定义需要监控的API端点
const MONITORED_ENDPOINTS = [
  '/api/upload',
  '/api/categories/smart',
  '/api/expiration',
  '/api/production-date'
];

export function ProcessingStatus() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());

  // 封装获取日志的函数
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error('获取日志失败');
      }
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('获取日志错误:', err);
    }
  }, []);

  // 监听网络请求
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: string | URL | Request, init?: any) => {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString()
          : input.url;
      
      // 检查是否是监控的端点
      const isMonitored = MONITORED_ENDPOINTS.some(endpoint => url.includes(endpoint));
      if (isMonitored) {
        setActiveRequests(prev => new Set([...prev, url]));
        
        try {
          const response = await originalFetch(input, init);
          // 如果请求成功完成，从活动请求中移除
          setActiveRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(url);
            return newSet;
          });
          
          // 在请求完成后等待一小段时间再获取最终日志
          setTimeout(fetchLogs, 1000);
          
          return response;
        } catch (error) {
          // 如果请求失败，也从活动请求中移除
          setActiveRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(url);
            return newSet;
          });
          
          // 错误情况下也获取最终日志
          setTimeout(fetchLogs, 1000);
          
          throw error;
        }
      }
      
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [fetchLogs]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout>;

    // 只有当有活动请求时才开始轮询
    if (activeRequests.size > 0) {
      fetchLogs();
      intervalId = setInterval(fetchLogs, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeRequests.size, fetchLogs]);

  // 如果没有活动请求且没有日志，不显示组件
  if (activeRequests.size === 0 && logs.length === 0) {
    return null;
  }

  const recentLogs = logs.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="space-y-1.5">
        {recentLogs.map((log) => (
          <div
            key={`${log.source}-${log.timestamp}`}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium
              flex items-center justify-between
              backdrop-blur-sm bg-opacity-90 shadow-sm
              transition-all duration-300 ease-in-out
              hover:scale-[1.02] hover:shadow-md
              ${{
                'info': `bg-gradient-to-r from-cyan-200/90 via-blue-300/90 via-violet-300/90 via-fuchsia-300/90 to-cyan-200/90 
                  text-blue-900 border border-blue-300 
                  animate-[shimmer_2s_linear_infinite]
                  bg-[length:300%_100%]
                  shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]`,
                'error': 'bg-red-100/80 text-red-800 border border-red-200',
                'success': 'bg-green-100/80 text-green-800 border border-green-200'
              }[log.type]}
            `}
          >
            <div className="flex-1 flex items-center space-x-2">
              <span className="truncate flex-1">{log.message}</span>
              <span className="text-xs text-gray-500 shrink-0 px-1.5 py-0.5 bg-gray-100 rounded">
                {log.source}
              </span>
            </div>
            <span className="text-gray-500 ml-2 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}