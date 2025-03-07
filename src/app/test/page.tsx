'use client';

import { useEffect, useState } from 'react';

interface SystemInfo {
  version: string;
  nodeEnv: string;
  uptime: number;
}

export default function TestPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch('/api/system-info');
        const data = await response.json();
        setSystemInfo(data);
      } catch (error) {
        console.error('获取系统信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          系统部署状态
        </h1>
        
        {loading ? (
          <div className="text-center text-gray-600">加载中...</div>
        ) : systemInfo ? (
          <div className="bg-white shadow rounded-lg p-6">
            <dl className="grid grid-cols-1 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">应用版本</dt>
                <dd className="mt-1 text-lg text-gray-900">{systemInfo.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">运行环境</dt>
                <dd className="mt-1 text-lg text-gray-900">{systemInfo.nodeEnv}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">运行时间</dt>
                <dd className="mt-1 text-lg text-gray-900">{systemInfo.uptime} 秒</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="text-center text-red-600">
            获取系统信息失败
          </div>
        )}
      </div>
    </div>
  );
}