"use client";

import React, { useState, useRef } from 'react';
import LoadingOverlay from './LoadingOverlay';

interface CameraCaptureProps {
  onCapture: (url: string, text: string) => void;
  onError?: (error: Error) => void;
  isActive: boolean;
  mode?: 'upload' | 'direct';
}

export default function CameraCapture({ onCapture, onError, isActive, mode = 'direct' }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isActive, facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Camera error:", error);
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error(String(error)));
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };



  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    try {
      // 获取base64格式的图片数据
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(base64Image, '');
    } catch (error) {
      console.error('图片处理失败:', error);
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error(String(error)));
      }
    }
  };

  return (
    <div className="relative w-full h-screen">
      <LoadingOverlay isLoading={isUploading} />
      {isActive && (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            className="w-full h-screen object-cover fixed inset-0"
          />
          <div className="absolute bottom-1/2 left-0 right-0 flex justify-center gap-4 z-30">
            <button
              onClick={captureImage}
              className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              type="button"
            >
              拍照
            </button>
            <button
              onClick={toggleCamera}
              className="bg-white/80 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
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