"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OSSImage } from "@/components/OSSImage";

interface Item {
  id: string;
  quantity: number;
  unit: string;
  expirationDate: string | null;
  note: string;
  product: {
    name: string;
    imageUrl: string | null;
    brand: string | null;
    specification: string | null;
  };
  cabinet: {
    name: string;
    room: {
      name: string;
    };
  };
  brick: {
    name: string;
    code: string;
  };
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (item: Item) => {
    return `${item.cabinet.room.name} - ${item.cabinet.name}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '无';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">物品列表</h1>
        <Link
          href="/items/add"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          添加物品
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {item.product.imageUrl && (
              <div className="relative w-full aspect-video">
                <OSSImage
                  objectKey={item.product.imageUrl}
                  alt={item.product.name}
                  className="object-contain"
                />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">{item.product.name}</h2>
              {item.product.brand && (
                <p className="text-gray-600 text-sm">品牌：{item.product.brand}</p>
              )}
              {item.product.specification && (
                <p className="text-gray-600 text-sm">规格：{item.product.specification}</p>
              )}
              <p className="text-gray-600 text-sm">分类：{item.brick.name}</p>
              <p className="text-gray-600 text-sm">位置：{formatLocation(item)}</p>
              <p className="text-gray-600 text-sm">
                数量：{item.quantity} {item.unit}
              </p>
              <p className="text-gray-600 text-sm">
                到期日期：{formatDate(item.expirationDate)}
              </p>
              {item.note && (
                <p className="text-gray-600 text-sm mt-2 italic">
                  备注：{item.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          暂无物品记录
        </div>
      )}
    </div>
  );
}