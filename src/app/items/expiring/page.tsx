"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Item {
  id: string;
  name: string;
  expirationDate: string;
  quantity: number;
}

export default function ExpiringItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const response = await fetch('/api/items/expiring');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch expiring items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOutStock = async (itemId: string) => {
    try {
      await fetch('/api/items/out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          quantity: 1,
        }),
      });
      
      // 刷新数据
      fetchExpiringItems();
    } catch (error) {
      console.error('Failed to process out operation:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/"
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold">临期物品</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">物品名称</th>
                <th className="text-left py-2">到期日期</th>
                <th className="text-left py-2">剩余数量</th>
                <th className="text-left py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{new Date(item.expirationDate).toLocaleDateString()}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">
                    <button 
                      onClick={() => handleOutStock(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      出库
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 