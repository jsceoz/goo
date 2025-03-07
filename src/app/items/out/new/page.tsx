"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import BarcodeScanner from "@/components/BarcodeScanner";
import CameraCapture from "@/components/CameraCapture";
import { OSSImage } from "@/components/OSSImage";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
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

interface SearchResult {
  id: string;
  score: number;
  imageUrl: string;
  name?: string;
  productId?: string;
}

interface FormData {
  itemId: string;
  quantity: string;
}

export default function NewQuickOut() {
  const [mode, setMode] = useState<'scan' | 'photo'>('scan');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    itemId: "",
    quantity: "",
  });

  // 重置状态
  const resetState = () => {
    setItems([]);
    setSelectedItem(null);
    setSearchResults([]);
    setSelectedProductId(null);
    setFormData({
      itemId: "",
      quantity: "",
    });
    setError(null);
    setIsScanning(true);
  };

  // 处理条码扫描
  const handleScan = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setIsScanning(false);  // 扫描到条码后停止扫描

    try {
      const response = await fetch(`/api/items/lookup?barcode=${barcode}`);
      if (!response.ok) {
        throw new Error('查询商品信息失败');
      }

      const data = await response.json();
      
      if (!data.found) {
        setError('未找到商品信息');
        setIsScanning(true);  // 如果未找到商品，重新开启扫描
        return;
      }

      await fetchItemsByProductId(data.product.id);

    } catch (error) {
      console.error('Scan error:', error);
      setError(error instanceof Error ? error.message : '扫描失败');
      setIsScanning(true);  // 如果发生错误，重新开启扫描
    } finally {
      setLoading(false);
    }
  };

  // 处理拍照识别
  const handleCapture = async (imageUrl: string) => {
    setLoading(true);
    setError(null);
    setShowCamera(false);  // 直接关闭相机

    try {
      const searchResponse = await fetch('/api/search/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          base64Data: imageUrl,
          topK: 5
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('图片搜索失败');
      }

      const searchResult = await searchResponse.json();

      if (!searchResult.found || !searchResult.results?.length) {
        setError('未找到相似商品');
        return;
      }

      // 过滤相似度分数
      const validResults = searchResult.results.filter((r: SearchResult) => r.score <= 500);
      if (validResults.length === 0) {
        setError('未找到足够相似的商品');
        return;
      }

      setSearchResults(validResults);

    } catch (error) {
      console.error('Image processing error:', error);
      setError(error instanceof Error ? error.message : '图片处理失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取商品库存信息
  const fetchItemsByProductId = async (productId: string) => {
    try {
      const itemsResponse = await fetch(`/api/items?productId=${productId}`);
      if (!itemsResponse.ok) {
        throw new Error('获取库存信息失败');
      }

      const itemsData = await itemsResponse.json();
      
      if (itemsData.length === 0) {
        setError('该商品暂无库存');
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
      console.error('Fetch items error:', error);
      setError(error instanceof Error ? error.message : '获取库存信息失败');
    }
  };

  // 处理商品选择
  const handleProductSelect = async (productId: string | null, imageUrl: string) => {
    try {
      if (!productId) {
        // 通过图片URL查询商品
        const productResponse = await fetch(`/api/items/lookup?imageUrl=${encodeURIComponent(imageUrl)}`);
        if (!productResponse.ok) {
          throw new Error('查询商品信息失败');
        }

        const productData = await productResponse.json();
        if (!productData.found) {
          setError('未找到商品信息');
          return;
        }

        productId = productData.product.id;
      }

      setSelectedProductId(productId);
      await fetchItemsByProductId(productId || '');
    } catch (error) {
      console.error('Product select error:', error);
      setError(error instanceof Error ? error.message : '选择商品失败');
    }
  };

  // 处理表单变化
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

  // 处理出库提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/items/out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: formData.itemId,
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '出库失败');
      }

      alert('出库成功！');
      resetState();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '出库失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('scan');
                setShowCamera(false);
              }}
              className={`px-4 py-1 rounded-full ${
                mode === 'scan' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              扫码
            </button>
            <button
              onClick={() => {
                setMode('photo');
                setShowCamera(true);
              }}
              className={`px-4 py-1 rounded-full ${
                mode === 'photo' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              拍照
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="pt-14 h-screen">
        {/* 扫描/拍照区域 */}
        <div className="h-1/2 relative">
          {mode === 'scan' && isScanning && (
            <BarcodeScanner
              onResult={handleScan}
              onError={(error) => setError(error.message)}
              isScanning={isScanning}
            />
          )}
          {mode === 'photo' && showCamera && (
            <div className="relative h-full">
              <CameraCapture
                onCapture={(url) => handleCapture(url)}
                onError={(error) => setError(error.message)}
                isActive={showCamera}
              />
              {/* 相机控制按钮 */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
                <button
                  onClick={() => setShowCamera(false)}
                  className="bg-white/80 text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
                  type="button"
                >
                  关闭相机
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-red-50 text-red-500 text-center">
            {error}
          </div>
        )}

        {/* 搜索结果列表 */}
        {mode === 'photo' && !showCamera && searchResults.length > 0 && !selectedProductId && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">请选择商品：</h3>
            <div className="space-y-4">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleProductSelect(result.productId || null, result.imageUrl)}
                  className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  {result.imageUrl && (
                    <OSSImage
                      objectKey={result.imageUrl}
                      alt={result.name || '商品图片'}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-500">
                      相似度：{((500 - result.score)/5).toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 出库表单 */}
        {items.length > 0 && (
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择库存
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "提交中..." : "确认出库"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 