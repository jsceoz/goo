'use client';

import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative">
        {/* 外圈旋转光环 */}
        <div className="absolute inset-0 animate-spin">
          <div className="h-16 w-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 opacity-75"></div>
        </div>
        
        {/* 内圈脉冲效果 */}
        <div className="absolute inset-0 animate-pulse">
          <div className="h-12 w-12 rounded-full border-4 border-transparent border-t-cyan-400 border-l-cyan-400 opacity-60"></div>
        </div>

        {/* 中心点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/50 animate-pulse"></div>
        </div>

        {/* 科技感文字 */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-blue-400">
          <span className="animate-pulse">Processing</span>
          <span className="animate-pulse delay-100">.</span>
          <span className="animate-pulse delay-200">.</span>
          <span className="animate-pulse delay-300">.</span>
        </div>
      </div>
    </div>
  );
}