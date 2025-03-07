'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Category {
  id: string
  code: string
  name: string
}

interface CategorySelectorProps {
  onSelect?: (brickId: string, brickCode: string) => void
  defaultBrickCode?: string
  productName?: string  // 添加商品名称属性
  onRef?: (ref: { handleSmartCategory: () => Promise<void> }) => void;  // 添加ref回调
}

export default function CategorySelector({ onSelect, defaultBrickCode, productName, onRef }: CategorySelectorProps) {
  const [segments, setSegments] = useState<Category[]>([])
  const [families, setFamilies] = useState<Category[]>([])
  const [classes, setClasses] = useState<Category[]>([])
  const [bricks, setBricks] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [selectedSegment, setSelectedSegment] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedBrick, setSelectedBrick] = useState('')
  
  const isAutoSelectRef = useRef(false)
  const loadedCodeRef = useRef<string>('')
  const isSmartCategoryRunningRef = useRef(false)  // 添加防抖标记

  // 加载一级分类
  useEffect(() => {
    fetch('/api/categories/segments')
      .then(res => res.json())
      .then(data => setSegments(data))
  }, [])

  // 加载二级分类
  const loadFamilies = async (segmentId: string) => {
    console.log('加载二级分类:', segmentId)
    const res = await fetch(`/api/categories/families?segmentId=${segmentId}`)
    const data = await res.json()
    console.log('获取到二级分类数据:', data.length, '条')
    setFamilies(data)
  }

  // 加载三级分类
  const loadClasses = async (familyId: string) => {
    console.log('加载三级分类:', familyId)
    const res = await fetch(`/api/categories/classes?familyId=${familyId}`)
    const data = await res.json()
    console.log('获取到三级分类数据:', data.length, '条')
    setClasses(data)
  }

  // 加载四级分类
  const loadBricks = async (classId: string) => {
    console.log('加载四级分类:', classId)
    const res = await fetch(`/api/categories/bricks?classId=${classId}`)
    const data = await res.json()
    console.log('获取到四级分类数据:', data.length, '条')
    setBricks(data)
  }

  // 手动选择处理
  const handleSegmentSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAutoSelectRef.current) return
    const value = e.target.value
    console.log('手动选择一级分类:', value)
    setSelectedSegment(value)
    if (value) {
      await loadFamilies(value)
      setSelectedFamily('')
      setSelectedClass('')
      setSelectedBrick('')
    } else {
      setFamilies([])
    }
  }

  const handleFamilySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAutoSelectRef.current) return
    const value = e.target.value
    console.log('手动选择二级分类:', value)
    setSelectedFamily(value)
    if (value) {
      await loadClasses(value)
      setSelectedClass('')
      setSelectedBrick('')
    } else {
      setClasses([])
    }
  }

  const handleClassSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAutoSelectRef.current) return
    const value = e.target.value
    console.log('手动选择三级分类:', value)
    setSelectedClass(value)
    if (value) {
      await loadBricks(value)
      setSelectedBrick('')
    } else {
      setBricks([])
    }
  }

  const handleBrickSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAutoSelectRef.current) return
    const value = e.target.value
    console.log('手动选择四级分类:', value)
    setSelectedBrick(value)
    if (value) {
      const selectedBrickItem = bricks.find(brick => brick.id === value)
      if (selectedBrickItem) {
        onSelect?.(value, selectedBrickItem.code)
      }
    }
  }

  // 自动填充处理
  useEffect(() => {
    if (defaultBrickCode && defaultBrickCode !== loadedCodeRef.current) {
      console.log('开始自动填充分类, code:', defaultBrickCode)
      loadedCodeRef.current = defaultBrickCode
      isAutoSelectRef.current = true

      fetch(`/api/categories/lookup?code=${defaultBrickCode}`)
        .then(res => res.json())
        .then(async data => {
          console.log('获取到分类路径数据:', data)
          
          // 设置选项和选中值
          setSegments(prevSegments => {
            const existingSegment = prevSegments.find(s => s.id === data.segment.id)
            return existingSegment ? prevSegments : [...prevSegments, data.segment]
          })
          setFamilies([data.family])
          setClasses([data.class])
          setBricks([data.brick])
          
          setSelectedSegment(data.segment.id)
          setSelectedFamily(data.family.id)
          setSelectedClass(data.class.id)
          setSelectedBrick(data.brick.id)

          console.log('触发选择回调:', data.brick.id, data.brick.code)
          onSelect?.(data.brick.id, data.brick.code)
        })
        .catch(error => {
          console.error('加载分类路径失败:', error)
          loadedCodeRef.current = ''
        })
        .finally(() => {
          console.log('自动填充完成，重置标记')
          isAutoSelectRef.current = false
        })
    }
  }, [defaultBrickCode, onSelect])

  // 暴露方法给父组件
  useEffect(() => {
    if (onRef) {
      onRef({ handleSmartCategory });
    }
  }, [onRef]);

  const handleSmartCategory = async () => {
    // 如果正在运行，则不重复执行
    if (isSmartCategoryRunningRef.current) return;
    
    // 添加商品名称校验
    if (!productName) {
      toast.warning('请先输入商品名称');
      return;
    }

    isSmartCategoryRunningRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch('/api/categories/smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName })
      });
      
      if (!response.ok) {
        throw new Error('智能分类请求失败');
      }
      
      const result = await response.json();
      
      // 优化结果处理逻辑
      if (result.status === 0 && result.code) {
        const lookupResponse = await fetch(`/api/categories/lookup?code=${result.code}`);
        if (!lookupResponse.ok) throw new Error('分类路径查询失败');
        
        const data = await lookupResponse.json();
        
        // 使用回调函数确保状态更新正确
        setSegments(prev => updateSegments(prev, data.segment));
        setFamilies([data.family]);
        setClasses([data.class]);
        setBricks([data.brick]);
        
        setSelectedSegment(data.segment.id);
        setSelectedFamily(data.family.id);
        setSelectedClass(data.class.id);
        setSelectedBrick(data.brick.id);

        onSelect?.(data.brick.id, data.brick.code);
        toast.success('智能分类成功！');
      } else {
        toast.warning(result?.message || '未能获取有效的分类编码');
      }
    } catch (error) {
      console.error('智能分类失败:', error);
      toast.error(error instanceof Error ? error.message : '智能分类失败');
    } finally {
      setIsLoading(false);
      isSmartCategoryRunningRef.current = false;
    }
  };

  // 辅助函数：更新一级分类列表
  const updateSegments = (prev: Category[], newSegment: Category) => {
    return prev.some(s => s.id === newSegment.id) ? prev : [...prev, newSegment];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">分类信息</h3>
        <button
          type="button"
          onClick={handleSmartCategory}
          disabled={isLoading}
          className={`px-3 py-1 text-sm ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded transition-colors flex items-center gap-2`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : '智能分类'}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">一级分类</label>
        <select
          value={selectedSegment}
          onChange={handleSegmentSelect}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">请选择</option>
          {segments.map(segment => (
            <option key={segment.id} value={segment.id}>
              {segment.code} - {segment.name}
            </option>
          ))}
        </select>
      </div>

      {families.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">二级分类</label>
          <select
            value={selectedFamily}
            onChange={handleFamilySelect}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            {families.map(family => (
              <option key={family.id} value={family.id}>
                {family.code} - {family.name}
              </option>
            ))}
          </select>
        </div>
      )}


      {classes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">三级分类</label>
          <select
            value={selectedClass}
            onChange={handleClassSelect}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.code} - {cls.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {bricks.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">四级分类</label>
          <select
            value={selectedBrick}
            onChange={handleBrickSelect}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">请选择</option>
            {bricks.map(brick => (
              <option key={brick.id} value={brick.id}>
                {brick.code} - {brick.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}