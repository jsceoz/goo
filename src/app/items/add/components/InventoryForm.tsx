'use client';

import React from 'react';
import type { FormData } from '../types';
import { LocationSelector } from './LocationSelector';

interface InventoryFormProps {
  formData: FormData;
  onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function InventoryForm({ formData, onChange }: InventoryFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">库存信息</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationSelector
          value={formData.cabinetId}
          onChange={(cabinetId) => onChange({
            target: { name: 'cabinetId', value: cabinetId }
          } as React.ChangeEvent<HTMLSelectElement>)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            数量 *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={onChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            单位
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          批次备注
        </label>
        <textarea
          name="itemNote"
          value={formData.itemNote}
          onChange={onChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="本批次特殊说明"
        />
      </div>
    </div>
  );
}