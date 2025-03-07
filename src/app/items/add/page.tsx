"use client";

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic'
import { Steps, Button } from 'antd-mobile';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProductForm } from './components/ProductForm';
import { ExpirationForm } from './components/ExpirationForm';
import { InventoryForm } from './components/InventoryForm';
import CategorySelector from './components/CategorySelector';
import { ScanSection } from './components/ScanSection';
import { ProcessingStatus } from './components/ProcessingStatus';
import type { FormData, Location } from './types'
import { ProductionDateForm } from './components/ProductionDateForm';

// Flash 效果组件
const FlashEffect = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-white z-50 animate-flash" 
      style={{ 
        animation: 'flash 0.5s ease-out',
        pointerEvents: 'none'
      }}
    />
  );
};

interface Category {
  id: string;
  name: string;
}

// 动态导入 BarcodeScanner，只在客户端渲染
const DynamicBarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  {
    ssr: false,  // 禁用服务端渲染
    loading: () => <p>Loading scanner...</p>
  }
)

// 动态导入 CameraCapture 组件
const DynamicCameraCapture = dynamic(
  () => import('@/components/CameraCapture'),
  {
    ssr: false,
    loading: () => <p>Loading camera...</p>
  }
);

const { Step } = Steps;

const initialFormData: FormData = {
  barcode: '',
  name: '',
  englishName: '',
  brand: '',
  manufacturer: '',
  specification: '',
  width: '',
  height: '',
  depth: '',
  grossWeight: '',
  netWeight: '',
  originCountry: '',
  goodsType: '',
  categoryCode: '',
  categoryName: '',
  price: '',
  referencePrice: '',
  imageUrl: '',
  firstShipDate: '',
  packagingType: '',
  shelfLife: '',
  minSalesUnit: '',
  certificationStandard: '',
  certificateLicense: '',
  note: '',
  hasExpiration: false,
  productionDate: '',
  expirationDate: '',
  shelfLifeDays: '',
  cabinetId: '',
  quantity: '1',
  unit: '个',
  itemNote: '',
  brickId: '',
};

export default function AddItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showFlash, setShowFlash] = useState(false);
  const categorySelectorRef = useRef<{ handleSmartCategory: () => Promise<void> } | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // 如果修改了生产日期或保质期天数，自动计算到期日期
    if ((name === 'productionDate' || name === 'shelfLifeDays') && formData.hasExpiration) {
      if (newFormData.productionDate && newFormData.shelfLifeDays) {
        const productionDate = new Date(newFormData.productionDate);
        const days = parseInt(newFormData.shelfLifeDays);
        if (!isNaN(days)) {
          const expirationDate = new Date(productionDate);
          expirationDate.setDate(expirationDate.getDate() + days);
          newFormData.expirationDate = expirationDate.toISOString().split('T')[0];
        }
      }
    }

    // 处理布尔值
    if (name === 'hasExpiration') {
      newFormData = {
        ...newFormData,
        hasExpiration: value === 'true',
        // 如果切换到无保质期，清空相关字段
        ...(value === 'false' && {
          productionDate: '',
          expirationDate: '',
          shelfLifeDays: '',
        }),
      };
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      if (formData.cabinetId) {
        localStorage.setItem('lastCabinetId', formData.cabinetId);
      }

      // 立即提交商品数据
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('提交失败');
      }

      // 先重置状态
      setFormData(initialFormData);
      setCurrentStep(0);
      
      // 显示成功提示
      toast.success('添加成功');

      // 等待一小段时间确保状态更新完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 最后进行路由跳转
      router.push('/');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (barcode: string) => {
    setShowCamera(false);  // 重置相机显示状态

    try {
      const response = await fetch(`/api/items/lookup?barcode=${barcode}`);
      
      // 处理接口调用失败的情况
      if (!response.ok) {
        setFormData(prev => ({
          ...prev,
          barcode: barcode,
        }));
        toast.error('查询商品信息失败，您可以手动拍照录入商品图片');
        setShowCamera(true);  // 显示拍照按钮
        return;
      }

      const data = await response.json();
      
      // 处理未找到商品信息的情况
      if (!data.found) {
        setFormData(prev => ({
          ...prev,
          barcode: barcode,
        }));
        toast.warning('未找到商品信息，您可以手动拍照录入商品图片');
        setShowCamera(true);  // 显示拍照按钮
        return;
      }

      const { product, defaultItem, lastItem } = data;
      
      // 使用最近一次的库存记录或默认值
      const itemDefaults = lastItem || defaultItem || {
        cabinetId: "",
        unit: "个",
        brickId: ""
      };

      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        ...product,
        ...itemDefaults,
      }));

      // 显示成功提示
      toast.success('商品信息查询成功！');

    } catch (error) {
      console.error('Scan error:', error);
      setFormData(prev => ({
        ...prev,
        barcode: barcode,
      }));
      toast.error(error instanceof Error ? error.message + '，您可以手动拍照录入商品图片' : '扫描失败，您可以手动拍照录入商品图片');
      setShowCamera(true);  // 显示拍照按钮
    }
  };

  const handleScanError = (error: Error) => {
    toast.error(error.message);
  };

  const handleManualLookup = async (barcode: string) => {
    if (!barcode.trim()) {
      toast.error('请输入条形码');
      return;
    }
    
    await handleScan(barcode.trim());
  };

  const handleImageCapture = async (imageUrl: string) => {
    // 触发闪烁效果
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);

    try {
      if (currentStep === 2) {
        // 保质期识别逻辑
        if (imageUrl.startsWith('data:')) {
          const response = await fetch('/api/expiration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Data: imageUrl }),
          });

          if (!response.ok) {
            throw new Error('保质期识别失败');
          }

          const result = await response.json();
          
          if (result?.recognition?.status === 0) {
            setFormData(prev => ({
              ...prev,
              hasExpiration: true,
              shelfLifeDays: result.recognition.shelfLife.toString()
            }));
            toast.success('保质期识别成功！');
          } else {
            toast.error(result?.recognition?.message || '保质期识别失败');
          }
        }
      } else if (currentStep === 3) {
        // 生产日期识别逻辑
        if (imageUrl.startsWith('data:')) {
          const response = await fetch('/api/production-date', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Data: imageUrl }),
          });

          if (!response.ok) {
            throw new Error('生产日期识别失败');
          }

          const result = await response.json();
          
          if (result?.recognition?.status === 0) {
            const productionDate = result.recognition.productionDate;
            // 验证日期格式
            if (!/^\d{4}-\d{2}-\d{2}$/.test(productionDate)) {
              throw new Error('无效的日期格式');
            }

            setFormData(prev => {
              const newFormData = {
                ...prev,
                productionDate
              };

              if (prev.hasExpiration && prev.shelfLifeDays) {
                const expirationDate = new Date(productionDate);
                expirationDate.setDate(expirationDate.getDate() + parseInt(prev.shelfLifeDays));
                newFormData.expirationDate = expirationDate.toISOString().split('T')[0];
              }

              return newFormData;
            });
            toast.success('生产日期识别成功！');
          } else {
            toast.error(result?.recognition?.message || '生产日期识别失败');
          }
        }
      } else {
        // 商品识别模式
        if (imageUrl.startsWith('data:')) {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Data: imageUrl }),
          });

          if (!response.ok) {
            throw new Error('上传失败');
          }

          const { url, recognition } = await response.json();
          
          try {
            // 检查状态码
            if (recognition?.status !== 0) {
              throw new Error(recognition?.msg || '商品识别失败');
            }

            // 更新商品信息
            const recognizedName = recognition.productName || '';
            setFormData(prev => ({
              ...prev,
              imageUrl: url,
              name: recognizedName,
            }));

            // 通过CategorySelector的ref触发智能分类
            if (recognizedName && categorySelectorRef.current) {
              categorySelectorRef.current.handleSmartCategory();
            }

          } catch (error) {
            console.error('处理识别结果失败:', error);
            const errorMessage = error instanceof Error ? error.message : '商品识别失败';
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        }
      }
    } catch (error) {
      console.error('图片处理失败:', error);
      toast.error(error instanceof Error ? error.message : '图片处理失败');
    }
  };

  // 处理分类选择
  const handleCategorySelect = (brickId: string, brickCode: string) => {
    setFormData(prev => ({
      ...prev,
      brickId,
      categoryCode: brickCode
    }));
  };

  const fetchLocations = async () => {
    try {
      const roomsRes = await fetch('/api/rooms');

      if (!roomsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const roomsData = await roomsRes.json();
      
      // 从本地存储中读取上次使用的位置信息
      const lastCabinetId = localStorage.getItem('lastCabinetId');
      
      // 只有在本地存储中有值时才设置位置
      if (lastCabinetId) {
        setFormData(prev => ({
          ...prev,
          cabinetId: lastCabinetId,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const steps = [
    {
      title: '基本信息',
      content: (
        <ProductForm formData={formData} onChange={handleInputChange} onCameraClick={() => setShowCamera(true)} />
      ),
    },
    {
      title: '分类信息',
      content: (
        <CategorySelector
          onSelect={handleCategorySelect}
          defaultBrickCode={formData.categoryCode}
          productName={formData.name}
          onRef={ref => categorySelectorRef.current = ref}
        />
      ),
    },
    {
      title: '保质期信息',
      content: (
        <ExpirationForm
          formData={formData}
          onChange={handleInputChange}
          onCameraClick={() => setShowCamera(true)}
        />
      ),
    },
    {
      title: '生产日期',
      content: (
        <ProductionDateForm
          formData={formData}
          onChange={handleInputChange}
          onCameraClick={() => setShowCamera(true)}
        />
      ),
    },
    {
      title: '库存信息',
      content: <InventoryForm formData={formData} onChange={handleInputChange} />,
    },
  ];

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <>
      <ToastContainer />
      <FlashEffect show={showFlash} />
      <div className="min-h-screen flex flex-col">

        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <div className="fixed top-0 left-0 right-0 z-30 bg-white/60 shadow-lg">
              <ProcessingStatus />
            </div>
            <ScanSection
              loading={loading}
              onScan={handleScan}
              onManualLookup={handleManualLookup}
              onImageCapture={handleImageCapture}
              imageUrl={formData.imageUrl}
              showCamera={showCamera}
              mode={currentStep === 2 ? 'expiration' : 'product'}
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white/60 shadow-lg z-20">
            <form onSubmit={handleSubmit} className="container mx-auto p-4 space-y-4">
              <Steps current={currentStep}>
                {steps.map(step => (
                  <Step key={step.title} title={step.title} />
                ))}
              </Steps>

              <div className="mt-8">{steps[currentStep].content}</div>

              <div className="mt-8 flex justify-between">
                {currentStep > 0 && (
                  <Button color="default" onClick={prevStep}>
                    上一步
                  </Button>
                )}
                {currentStep < steps.length - 1 && (
                  <Button color="primary" onClick={nextStep}>
                    下一步
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button color="primary" onClick={handleSubmit}>
                    提交
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}