'use client';

import { useState } from 'react';

export default function BailianTest() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTest = async () => {
    try {
      setError('');
      setResult(null);
      
      const response = await fetch('/api/bailian/lease', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '租约申请失败');
      }

      const data = await response.json();
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || '租约申请失败');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">百炼平台文件上传租约测试</h1>
      
      <button
        onClick={handleTest}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        申请文件上传租约
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">错误信息：</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-bold">返回结果：</p>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}