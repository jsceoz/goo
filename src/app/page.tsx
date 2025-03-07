"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Item {
  id: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  product: {
    name: string;
    imageUrl: string | null;
  };
  location: {
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  cabinets: {
    id: string;
    name: string;
  }[];
}

interface ExpiringItem {
  id: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  product: {
    name: string;
    imageUrl: string | null;
  };
  cabinet: {
    name: string;
    room: {
      name: string;
    };
  };
}

export default function Home() {
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocations, setHasLocations] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  useEffect(() => {
    const fetchExpiringItems = async () => {
      try {
        const response = await fetch('/api/items/expiring');
        if (!response.ok) {
          throw new Error('Failed to fetch expiring items');
        }
        const data = await response.json();
        setExpiringItems(data);
      } catch (error) {
        console.error('Error fetching expiring items:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkLocations = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        const rooms: Room[] = await response.json();
        // 检查是否有房间且至少有一个房间包含柜子
        const hasAvailableLocations = rooms.some(room => room.cabinets?.length > 0);
        setHasLocations(hasAvailableLocations);
      } catch (error) {
        console.error('Error checking locations:', error);
        setHasLocations(false);
      } finally {
        setLocationChecked(true);
      }
    };

    fetchExpiringItems();
    checkLocations();
  }, []);

  const formatLocation = (item: ExpiringItem) => {
    return `${item.cabinet.room.name} - ${item.cabinet.name}`;
  };

  const formatDate = (date: string) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString();
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">库存管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {locationChecked && !hasLocations && (
          <div className="lg:col-span-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            请先添加存储位置，再进行入库操作。
            <Link href="/locations" className="text-yellow-600 hover:text-yellow-700 underline ml-2">
              去添加
            </Link>
          </div>
        )}
        
        <Link
          href={hasLocations ? "/items/add" : "#"}
          className={`block p-6 rounded-lg transition-colors ${
            hasLocations 
              ? "bg-blue-500 text-white hover:bg-blue-600" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={e => !hasLocations && e.preventDefault()}
        >
          <h2 className="text-xl font-semibold mb-2">入库</h2>
          <p>添加新物品到库存</p>
        </Link>

        <Link
          href="/items/out/new"
          className="block p-6 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">出库</h2>
          <p>扫码快速出库</p>
        </Link>

        <Link
          href="/items"
          className="block p-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">物品列表</h2>
          <p>查看和管理所有物品</p>
        </Link>

        <Link
          href="/locations"
          className="block p-6 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">存储位置</h2>
          <p>管理房间和储物位置</p>
        </Link>

        <Link
          href="/items/manage"
          className="block p-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">物品管理</h2>
          <p>管理和筛选所有物品</p>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">临期提醒</h2>
        {loading ? (
          <p>加载中...</p>
        ) : expiringItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                {item.product.imageUrl && (
                  <div className="relative w-full aspect-video mb-4">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                )}
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {formatLocation(item)}
                </p>
                <p className="text-gray-600 text-sm">
                  数量：{item.quantity} {item.unit}
                </p>
                <p className="text-red-600 text-sm mt-2">
                  过期时间：{formatDate(item.expirationDate)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无临期物品</p>
        )}
      </div>
    </main>
  );
}
