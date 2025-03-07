"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useZxing } from "react-zxing";
import type { Result } from "@zxing/library";
import { ObjectDetector, Detection } from '@/lib/objectDetector';

interface UnifiedCameraProps {
  onScan?: (barcode: string) => void;
  onCapture?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
  isActive: boolean;
}

interface DetectedObject {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export default function UnifiedCamera({ 
  onScan, 
  onCapture, 
  onError, 
  isActive 
}: UnifiedCameraProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const detectorRef = useRef<ObjectDetector | null>(null);

  // 配置扫码器
  const { ref: zxingRef } = useZxing({
    paused: !isActive,
    constraints: {
      video: {
        facingMode: facingMode,
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      }
    },
    onDecodeResult: (result: Result) => {
      if (!result) return;
      const text = result.getText();
      if (!text) return;
      onScan?.(text);
    },
    onError: (error: unknown) => {
      console.error("Camera error:", error);
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error(String(error)));
      }
    },
    timeBetweenDecodingAttempts: 300,
  });

  // 初始化检测器
  useEffect(() => {
    const initDetector = async () => {
      try {
        if (!detectorRef.current) {
          detectorRef.current = new ObjectDetector();
        }
        await detectorRef.current.init();
      } catch (error) {
        console.error('Failed to initialize detector:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to initialize detector'));
      }
    };

    if (isActive) {
      initDetector();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onError]);

  // 修改 AR 检测逻辑
  useEffect(() => {
    if (!isActive) return;

    const detectObjects = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth || !detectorRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // 执行 AI 检测
        const detections = await detectorRef.current.detect(video);
        
        // 清除上一帧
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制检测结果
        drawDetections(ctx, detections);
      } catch (error) {
        console.error('Detection error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectObjects);
    };

    const handleVideoLoad = () => {
      if (videoRef.current) {
        detectObjects();
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleVideoLoad);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', handleVideoLoad);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  // 绘制检测结果
  const drawDetections = (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
    detections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox;
      const label = `${detection.class} ${(detection.score * 100).toFixed(0)}%`;
      
      // 为每个类别使用不同的颜色
      const hue = (index * 137.5) % 360;  // 黄金角度分配颜色
      const color = `hsla(${hue}, 100%, 50%, 0.7)`;
      
      // 绘制边界框
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // 绘制标签背景
      ctx.fillStyle = color;
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 25, textWidth + 10, 25);
      
      // 绘制标签文字
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(label, x + 5, y - 7);
      
      // 绘制角标
      const cornerSize = Math.min(width, height) * 0.2;
      drawCorner(ctx, x, y, cornerSize, 0);
      drawCorner(ctx, x + width, y, cornerSize, Math.PI/2);
      drawCorner(ctx, x, y + height, cornerSize, -Math.PI/2);
      drawCorner(ctx, x + width, y + height, cornerSize, Math.PI);
    });
  };

  // 辅助函数：绘制角标
  const drawCorner = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    
    ctx.restore();
  };

  // 切换前后摄像头
  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  // 拍照
  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    // 绘制当前视频帧
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    try {
      // 转换为base64格式
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture?.(imageUrl);
    } catch (error) {
      console.error('Image capture failed:', error);
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error(String(error)));
      }
    }
  };

  // 同步video引用
  const setVideoRef = (video: HTMLVideoElement | null) => {
    if (video) {
      videoRef.current = video;
      // @ts-ignore - react-zxing的类型定义问题
      zxingRef.current = video;
    }
  };

  return (
    <div className="relative w-full h-screen">
      {isActive && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <video 
              ref={setVideoRef}
              autoPlay 
              playsInline
              className="absolute w-full h-full object-contain"
            />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="absolute w-full h-full object-contain pointer-events-none"
              style={{
                objectFit: 'contain'
              }}
            />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-32 relative">
              <div className="absolute inset-0 border-2 border-blue-500/30 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500/30 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500/30 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500/30 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500/30 rounded-br"></div>
              </div>
              <div 
                className="absolute left-0 right-0 h-0.5 bg-blue-500/70 animate-scan-line"
                style={{
                  animation: 'scan-line 2s ease-in-out infinite',
                }}
              ></div>
            </div>
          </div>

          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 z-30">
            <button
              onClick={captureImage}
              className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              type="button"
            >
              拍照
            </button>
            <button
              onClick={toggleCamera}
              className="bg-white/80 text-gray-800 px-6 py-3 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              type="button"
            >
              切换摄像头
            </button>
          </div>
        </>
      )}
    </div>
  );
} 