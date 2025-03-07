'use client';

import React, { useState } from 'react';
import type { FormData } from '../types';

interface BasicInfoFormProps {
  formData: FormData;
  onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function BasicInfoForm({ formData, onChange }: BasicInfoFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">基本信息</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? '收起' : '展开更多'}
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            物品名称 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${
          isExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              英文名称
            </label>
            <input
              type="text"
              name="englishName"
              value={formData.englishName}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              品牌
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              制造商
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规格
            </label>
            <input
              type="text"
              name="specification"
              value={formData.specification}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              参考价格
            </label>
            <input
              type="number"
              name="referencePrice"
              value={formData.referencePrice}
              onChange={onChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              宽度 (cm)
            </label>
            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={onChange}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              高度 (cm)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={onChange}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              深度 (cm)
            </label>
            <input
              type="number"
              name="depth"
              value={formData.depth}
              onChange={onChange}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              毛重 (kg)
            </label>
            <input
              type="number"
              name="grossWeight"
              value={formData.grossWeight}
              onChange={onChange}
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              净重 (kg)
            </label>
            <input
              type="number"
              name="netWeight"
              value={formData.netWeight}
              onChange={onChange}
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              产地
            </label>
            <input
              type="text"
              name="originCountry"
              value={formData.originCountry}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品类型
            </label>
            <input
              type="text"
              name="goodsType"
              value={formData.goodsType}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              包装类型
            </label>
            <input
              type="text"
              name="packagingType"
              value={formData.packagingType}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              保质期
            </label>
            <input
              type="text"
              name="shelfLife"
              value={formData.shelfLife}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最小销售单位
            </label>
            <input
              type="text"
              name="minSalesUnit"
              value={formData.minSalesUnit}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              认证标准
            </label>
            <input
              type="text"
              name="certificationStandard"
              value={formData.certificationStandard}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              认证许可
            </label>
            <input
              type="text"
              name="certificateLicense"
              value={formData.certificateLicense}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className={`transition-all duration-300 ${
          isExpanded ? 'opacity-100 max-h-[200px]' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            备注
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={onChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}