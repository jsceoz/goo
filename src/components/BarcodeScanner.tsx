"use client";

import { useState } from "react";
import { useZxing } from "react-zxing";
import type { Result } from "@zxing/library";

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
  isScanning: boolean;
}

export default function BarcodeScanner({ onResult, onError, isScanning }: BarcodeScannerProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const { ref } = useZxing({
    paused: !isScanning,
    constraints: {
      video: {
        facingMode: facingMode,
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      }
    },
    onDecodeResult: (result: Result) => {
      if (!result) {
        console.error("Invalid scan result");
        onError?.(new Error("扫描结果无效"));
        return;
      }
      const text = result.getText();
      if (!text) {
        console.error("Empty scan result");
        onError?.(new Error("扫描结果为空"));
        return;
      }
      onResult(text);
    },
    onError: (error: unknown) => {
      console.error("Scanner error:", error);
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error(String(error)));
      }
    },
    timeBetweenDecodingAttempts: 300,
  });

  // 切换前后摄像头
  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <div className="relative">
      {isScanning && (
        <>
          <div className="relative w-full h-screen">
            <video 
              ref={ref} 
              className="w-full h-full object-cover fixed inset-0"
            />
            <div className="absolute inset-0">
              {/* 清晰的扫码区域 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32">
                {/* 清除扫码区域的模糊效果 */}
                <div className="absolute inset-0">
                  {/* 扫码区域边框 */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                    {/* 四个角的装饰 */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br"></div>
                  </div>
                  {/* 扫描线动画 */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-scan"></div>
                </div>
              </div>
            </div>
            <div className="fixed top-4 right-4 z-50 flex gap-2">
              {/* <button
                onClick={toggleCamera}
                className="bg-white/90 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors"
                type="button"
              >
                切换摄像头
              </button> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}