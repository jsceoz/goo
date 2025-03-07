import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export class ObjectDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private loading: boolean = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.model) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      if (this.loading) return;
      this.loading = true;
      
      try {
        // 确保 WebGL 后端已初始化
        await tf.setBackend('webgl');
        await tf.ready();
        
        // 加载 COCO-SSD 模型
        this.model = await cocoSsd.load({
          base: 'mobilenet_v2'
        });
        
        console.log('Model loaded successfully');
      } catch (error) {
        console.error('Failed to load model:', error);
        this.model = null;
        throw error;
      } finally {
        this.loading = false;
      }
    })();

    return this.initPromise;
  }

  async detect(video: HTMLVideoElement): Promise<Detection[]> {
    if (!this.model) {
      await this.init();
      if (!this.model) {
        throw new Error('Model initialization failed');
      }
    }

    try {
      // 使用 COCO-SSD 进行检测
      const predictions = await this.model.detect(video);

      // 转换预测结果格式
      return predictions.map(pred => ({
        bbox: [
          pred.bbox[0],                    // x
          pred.bbox[1],                    // y
          pred.bbox[2],                    // width
          pred.bbox[3]                     // height
        ] as [number, number, number, number],
        class: LABEL_MAP[pred.class] || pred.class,
        score: pred.score
      }));

    } catch (error) {
      console.error('Detection failed:', error);
      throw error;
    }
  }
}

// 中文标签映射
const LABEL_MAP: Record<string, string> = {
  'person': '人',
  'bicycle': '自行车',
  'car': '汽车',
  'motorcycle': '摩托车',
  'airplane': '飞机',
  'bus': '公交车',
  'train': '火车',
  'truck': '卡车',
  'boat': '船',
  'traffic light': '红绿灯',
  'backpack': '背包',
  'umbrella': '雨伞',
  'handbag': '手提包',
  'tie': '领带',
  'suitcase': '箱子',
  'bottle': '瓶子',
  'cup': '杯子',
  'fork': '叉子',
  'knife': '刀',
  'spoon': '勺子',
  'bowl': '碗',
  'banana': '香蕉',
  'apple': '苹果',
  'sandwich': '三明治',
  'orange': '橙子',
  'broccoli': '西兰花',
  'carrot': '胡萝卜',
  'hot dog': '热狗',
  'pizza': '披萨',
  'donut': '甜甜圈',
  'cake': '蛋糕',
  'cell phone': '手机',
  'laptop': '笔记本',
  'mouse': '鼠标',
  'remote': '遥控器',
  'keyboard': '键盘',
}; 