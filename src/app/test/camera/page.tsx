"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import UnifiedCamera from '@/components/UnifiedCamera';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CameraTest() {
  const [isActive, setIsActive] = useState(true);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  const handleScan = (barcode: string) => {
    setLastBarcode(barcode);
    toast.success(`扫码成功: ${barcode}`);
  };

  const handleCapture = (imageUrl: string) => {
    setLastImage(imageUrl);
    toast.success('拍照成功');
  };

  const handleError = (error: Error) => {
    toast.error(`错误: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer />
      
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <button
            onClick={() => setIsActive(prev => !prev)}
            className={`px-4 py-1 rounded-full ${
              isActive 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {isActive ? '停止相机' : '启动相机'}
          </button>
        </div>
      </div>

      {/* 相机组件 */}
      <div className="pt-14 h-screen">
        <UnifiedCamera
          isActive={isActive}
          onScan={handleScan}
          onCapture={handleCapture}
          onError={handleError}
        />
      </div>

      {/* 结果展示区域 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg z-40">
        <div className="container mx-auto p-4 space-y-4">
          {/* 扫码结果 */}
          {lastBarcode && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800">最近扫码结果:</div>
              <div className="text-blue-600 break-all">{lastBarcode}</div>
            </div>
          )}

          {/* 拍照结果 */}
          {lastImage && (
            <div className="space-y-2">
              <div className="font-medium text-gray-700">最近拍照:</div>
              <div className="relative w-32 h-32">
                <img
                  src={lastImage}
                  alt="Captured"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => setLastImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  title="删除图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 