'use client';

import React, { useState } from 'react';
import { Toast } from 'antd-mobile';
import type { FormData } from '../types';

interface ExpirationFormProps {
  formData: FormData;
  onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCameraClick?: () => void;
  onRecognize?: (base64Data: string) => Promise<void>;
}

export function ExpirationForm({ formData, onChange, onCameraClick, onRecognize }: ExpirationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 处理预览图片的显示和隐藏
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;;
    if (previewImage) {
      timer = setTimeout(() => {
        setPreviewImage(null);
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [previewImage]);

  const handleRecognize = async (imageUrl: string) => {
    setIsLoading(true);
    setPreviewImage(imageUrl);

    try {
      // 从 base64 URL 中提取实际的 base64 数据
      const base64Data = imageUrl.split(',')[1];

      // 调用保质期识别 API
      const response = await fetch('/api/expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Data }),
      });

      if (!response.ok) {
        throw new Error('识别请求失败');
      }

      const recognition = await response.json();
      console.log('识别结果:', recognition);

      if (recognition?.output?.text) {
        try {
          const expirationInfo = JSON.parse(recognition.output.text);
          if (expirationInfo.shelfLifeDays) {
            // 更新表单数据
            onChange({
              target: { name: 'hasExpiration', value: 'true' }
            } as React.ChangeEvent<HTMLSelectElement>);

            onChange({
              target: { name: 'shelfLifeDays', value: expirationInfo.shelfLifeDays.toString() }
            } as React.ChangeEvent<HTMLInputElement>);

            Toast.show({
              icon: 'success',
              content: '识别成功',
            });
          } else {
            Toast.show({
              icon: 'fail',
              content: '未识别到保质期信息',
            });
          }
        } catch (error) {
          console.error('解析识别结果失败:', error);
          Toast.show({
            icon: 'fail',
            content: '识别结果解析失败',
          });
        }
      }
    } catch (error) {
      console.error('识别保质期失败:', error);
      Toast.show({
        icon: 'fail',
        content: '识别失败',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 预览图片 */}
      {previewImage && (
        <div className="fixed top-4 left-4 z-50 shadow-lg rounded-lg overflow-hidden" style={{ width: '120px', height: '120px' }}>
          <img
            src={previewImage}
            alt="预览"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">保质期信息</h3>
        <button
          type="button"
          onClick={onCameraClick}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : '拍照识别'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            是否有保质期 *
          </label>
          <select
            name="hasExpiration"
            value={formData.hasExpiration ? "true" : "false"}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="false">无保质期</option>
            <option value="true">有保质期</option>
          </select>
        </div>

        {formData.hasExpiration && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              保质期天数 *
            </label>
            <input
              type="number"
              name="shelfLifeDays"
              value={formData.shelfLifeDays}
              onChange={onChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={formData.hasExpiration}
            />
          </div>
        )}
      </div>
    </div>
  );
}