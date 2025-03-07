'use client';

import { useEffect, useState } from 'react';

interface Room {
  id: string;
  name: string;
  cabinets: Cabinet[];
}

interface Cabinet {
  id: string;
  name: string;
  roomId: string;
}

interface LocationSelectorProps {
  value: string;  // cabinetId
  onChange: (cabinetId: string) => void;
}

// 本地存储的键名
const STORAGE_KEY = 'lastSelectedLocation';

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    // 当有默认值时，设置对应的房间
    if (value && rooms.length > 0) {
      const cabinet = rooms.flatMap(r => r.cabinets).find(c => c.id === value);
      if (cabinet) {
        setSelectedRoomId(cabinet.roomId);
      }
    } else if (rooms.length > 0) {
      // 如果没有默认值，尝试从本地存储恢复上次的选择
      const lastSelected = localStorage.getItem(STORAGE_KEY);
      if (lastSelected) {
        try {
          const { roomId, cabinetId } = JSON.parse(lastSelected);
          // 验证存储的位置是否仍然有效
          const room = rooms.find(r => r.id === roomId);
          const cabinet = room?.cabinets.find(c => c.id === cabinetId);
          if (room && cabinet) {
            setSelectedRoomId(roomId);
            onChange(cabinetId);
          }
        } catch (error) {
          console.error('Error parsing stored location:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [value, rooms, onChange]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);

      // 如果没有选择房间且有数据，默认选择第一个房间
      if (!selectedRoomId && data.length > 0) {
        setSelectedRoomId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const cabinets = selectedRoom?.cabinets || [];

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    // 当切换房间时，自动选择该房间的第一个柜子
    const room = rooms.find(r => r.id === roomId);
    if (room && room.cabinets && room.cabinets.length > 0) {
      const cabinetId = room.cabinets[0].id;
      onChange(cabinetId);
      // 保存选择到本地存储
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, cabinetId }));
    } else {
      onChange('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleCabinetChange = (cabinetId: string) => {
    onChange(cabinetId);
    // 保存选择到本地存储
    if (cabinetId && selectedRoomId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        roomId: selectedRoomId,
        cabinetId
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          房间 *
        </label>
        <select
          value={selectedRoomId}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">选择房间</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          储存位置 *
        </label>
        <select
          value={value}
          onChange={(e) => handleCabinetChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!selectedRoomId}
        >
          <option value="">选择储存位置</option>
          {cabinets.map(cabinet => (
            <option key={cabinet.id} value={cabinet.id}>
              {cabinet.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}