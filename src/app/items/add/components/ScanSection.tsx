'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { OSSImage } from '@/components/OSSImage';

const DynamicBarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  {
    ssr: false,
    loading: () => <p>Loading scanner...</p>
  }
);

const DynamicCameraCapture = dynamic(
  () => import('@/components/CameraCapture'),
  {
    ssr: false,
    loading: () => <p>Loading camera...</p>
  }
);

export interface ScanSectionProps {
  loading: boolean;
  onScan: (barcode: string) => void;
  onManualLookup: (barcode: string) => void;
  onImageCapture: (imageUrl: string) => void;
  imageUrl: string;
  showCamera: boolean;
  mode: 'product' | 'expiration';
}

export function ScanSection({
  loading,
  onScan,
  onManualLookup,
  onImageCapture,
  imageUrl,
  showCamera,
  mode
}: ScanSectionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  const handleScanResult = async (barcode: string) => {
    setIsScanning(false);
    await onScan(barcode);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onManualLookup(manualBarcode);
    setManualBarcode("");
  };

  // 切换扫码和拍照模式
  const toggleMode = () => {
    if (isScanning) {
      setIsScanning(false);
      setIsCameraActive(true);
    } else if (isCameraActive) {
      setIsCameraActive(false);
      setIsScanning(true);
    }
  };

  // 在组件加载时自动开始扫码
  useEffect(() => {
    setIsScanning(true);
  }, []);

  // 监听showCamera的变化，当为true时自动激活相机
  useEffect(() => {
    if (showCamera) {
      setIsCameraActive(true);
      setIsScanning(false);
    }
  }, [showCamera]);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-black z-0">
        {isScanning && (
          <div className="relative h-screen">
            <DynamicBarcodeScanner
              isScanning={isScanning}
              onResult={handleScanResult}
              onError={(error) => {
                console.error('Scanner error:', error);
              }}
            />
            <div className="fixed top-4 right-4 z-[100] flex gap-2">
              <button
                type="button"
                onClick={toggleMode}
                className="bg-white/90 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                切换到拍照
              </button>
              {/* <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="bg-white/90 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                关闭扫码
              </button> */}
            </div>
          </div>
        )}
      </div>

      {/* {imageUrl && (
        <div className="mb-6">
          <div className="relative w-full aspect-video max-w-md mx-auto">
            {(() => {
              console.log('当前图片URL:', imageUrl);
              return imageUrl.startsWith('data:') || !imageUrl.includes('goo-jsceoz-oss.oss-cn-shenzhen.aliyuncs.com') ? (
                <img
                  src={imageUrl}
                  alt="商品图片"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <OSSImage
                  objectKey={imageUrl}
                  alt="商品图片"
                  className="w-full h-full object-contain rounded-lg"
                />
              );
            })()}
            <button
              type="button"
              onClick={() => onImageCapture('')}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              title="删除图片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )} */}

      {isCameraActive && (
        <div className="mb-6">
          <DynamicCameraCapture
            isActive={isCameraActive}
            mode={mode === 'expiration' ? 'direct' : 'upload'}
            onCapture={(imageUrl, recognizedName) => {
              onImageCapture(imageUrl);
            }}
            onError={(error) => {
              console.error('Camera error:', error);
            }}
          />
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={toggleMode}
              className="bg-white/80 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
            >
              切换到扫码
            </button>
          </div>
        </div>
      )}
    </div>
  );
}