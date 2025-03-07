"use client";

import React from 'react';
import { useState } from "react";
import Link from "next/link";
import BarcodeScanner from "@/components/BarcodeScanner";
import CameraCapture from "@/components/CameraCapture";
import { generateMultimodalEmbedding } from '@/lib/doubao';
import { searchVectors } from '@/lib/dashvector';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
}

interface SearchResult {
  id: string;
  score: number;
  imageUrl: string;
  name?: string;
  productId?: string;
}

interface Item {
  id: string;
  quantity: number;
  unit: string;
  product: Product;
  cabinet: {
    name: string;
  };
}

interface FormData {
  itemId: string;
  quantity: string;
}

export default function QuickOut() {
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    itemId: "",
    quantity: "",
  });

  // 重置扫描状态
  const resetScan = () => {
    setItems([]);
    setSelectedItem(null);
    setFormData({
      itemId: "",
      quantity: "",
    });
    setScanError(null);
  };

  const handleScan = async (barcode: string) => {
    setIsScanning(false);
    setScanError(null);

    try {
      const response = await fetch(`/api/items/lookup?barcode=${barcode}`);
      if (!response.ok) {
        throw new Error('查询商品信息失败');
      }

      const data = await response.json();
      
      if (!data.found) {
        setScanError('未找到商品信息');
        return;
      }

      // 获取该商品的所有库存记录
      const itemsResponse = await fetch(`/api/items?productId=${data.product.id}`);
      if (!itemsResponse.ok) {
        throw new Error('获取库存信息失败');
      }

      const itemsData = await itemsResponse.json();
      
      if (itemsData.length === 0) {
        setScanError('该商品暂无库存');
        return;
      }

      setItems(itemsData);

      // 如果只有一个库存记录，自动选择
      if (itemsData.length === 1) {
        setSelectedItem(itemsData[0]);
        setFormData(prev => ({
          ...prev,
          itemId: itemsData[0].id,
        }));
      }

    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error instanceof Error ? error.message : '扫描失败');
    }
  };

  const handleScanError = (error: Error) => {
    console.error('Scan error:', error);
    setScanError(error.message);
  };

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) {
      setScanError('请输入条形码');
      return;
    }
    await handleScan(manualBarcode.trim());
    setManualBarcode(""); // 清空输入框
  };

  const handleImageCapture = async (imageUrl: string) => {
    setShowCamera(false);
    setLoading(true);
    setScanError(null);

    try {
      const searchResponse = await fetch('/api/search/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          base64Data: imageUrl,
          topK: 1
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('图片搜索失败');
      }

      const searchResult = await searchResponse.json();

      if (!searchResult.found || !searchResult.results?.length) {
        setScanError('未找到相似商品');
        return;
      }

      // 获取最相似的商品信息
      const topMatch = searchResult.results[0];
      
      // 检查相似度阈值
      if (topMatch.score > 500) {
        setScanError('未找到足够相似的商品');
        return;
      }
      
      // 如果搜索结果中直接包含productId，可以直接使用
      if (topMatch.productId) {
        const itemsResponse = await fetch(`/api/items?productId=${topMatch.productId}`);
        if (!itemsResponse.ok) {
          throw new Error('获取库存信息失败');
        }

        const itemsData = await itemsResponse.json();
        
        if (itemsData.length === 0) {
          setScanError('该商品暂无库存');
          return;
        }

        setItems(itemsData);

        // 如果只有一个库存记录，自动选择
        if (itemsData.length === 1) {
          setSelectedItem(itemsData[0]);
          setFormData(prev => ({
            ...prev,
            itemId: itemsData[0].id,
          }));
        }
        return;
      }

      // 如果没有productId，则通过imageUrl查询
      const matchedImageUrl = topMatch.imageUrl;

      const productResponse = await fetch(`/api/items/lookup?imageUrl=${encodeURIComponent(matchedImageUrl)}`);
      if (!productResponse.ok) {
        throw new Error('查询商品信息失败');
      }

      const productData = await productResponse.json();
      
      if (!productData.found) {
        setScanError('未找到商品信息');
        return;
      }

      // 获取库存信息
      const itemsResponse = await fetch(`/api/items?productId=${productData.product.id}`);
      if (!itemsResponse.ok) {
        throw new Error('获取库存信息失败');
      }

      const itemsData = await itemsResponse.json();
      
      if (itemsData.length === 0) {
        setScanError('该商品暂无库存');
        return;
      }

      setItems(itemsData);
      console.log(itemsData, 'itemsData');

      // 如果只有一个库存记录，自动选择
      if (itemsData.length === 1) {
        setSelectedItem(itemsData[0]);
        setFormData(prev => ({
          ...prev,
          itemId: itemsData[0].id,
        }));
      }

    } catch (error) {
      console.error('Image processing error:', error);
      setScanError(error instanceof Error ? error.message : '图片处理失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || !formData.quantity) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/items/out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '出库失败');
      }

      alert('出库成功！');
      resetScan(); // 重置表单
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '出库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'itemId') {
      const item = items.find(i => i.id === value);
      setSelectedItem(item || null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-2xl font-bold">快速出库</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* 扫描区域 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">第一步：扫描商品</h2>
            {/* 模式切换按钮 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsScanning(true);
                  setShowCamera(false);
                }}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  isScanning 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                条码扫描
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCamera(true);
                  setIsScanning(false);
                }}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  showCamera 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                拍照识别
              </button>
            </div>

            <div className="space-y-4">
              {isScanning ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <BarcodeScanner 
                    onResult={handleScan} 
                    onError={handleScanError}
                    isScanning={isScanning}
                  />
                  <button
                    onClick={() => setIsScanning(false)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  >
                    关闭扫描
                  </button>
                </div>
              ) : showCamera ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <CameraCapture
                    onCapture={handleImageCapture}
                    onError={(error) => setScanError(error.message)}
                    isActive={showCamera}
                  />
                  <button
                    onClick={() => setShowCamera(false)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  >
                    关闭相机
                  </button>
                </div>
              ) : loading ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">处理中...</div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">
                    {isScanning ? '准备扫描...' : showCamera ? '准备拍照...' : '请选择识别方式'}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="手动输入条形码"
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleManualLookup}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  查询
                </button>
              </div>

              {scanError && (
                <div className="text-red-500 text-sm">
                  {scanError}
                </div>
              )}
            </div>
          </div>

          {/* 出库表单 */}
          {items.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">第二步：选择库存和数量</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择库存
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择库存</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.product.name} - {item.cabinet.name} ({item.quantity}{item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出库数量 (最大: {selectedItem.quantity})
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    max={selectedItem.quantity}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "提交中..." : "确认出库"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 