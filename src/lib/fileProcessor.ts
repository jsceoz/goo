import crypto from 'crypto';
import { BailianClient } from './bailian';
import { getImageRecognition, getExpirationRecognition, getProductionDateRecognition } from './dashscope';
import { addLog } from '@/lib/logger';

export class FileProcessor {
  private source: string;

  constructor(
    private buffer: Buffer,
    private fileName: string,
    private type?: 'product' | 'expiration' | 'production-date'
  ) {
    // 根据类型确定日志来源
    this.source = type ? `api-${type}` : 'api-upload';
  }

  // 计算文件的MD5和大小
  public calculateFileInfo() {
    addLog('info', `开始计算文件信息: ${this.fileName}`, this.source);
    const md5 = crypto.createHash('md5').update(this.buffer).digest('hex');
    const sizeInBytes = this.buffer.length.toString();
    addLog('success', `文件信息计算完成 - MD5: ${md5}, 大小: ${sizeInBytes} 字节`, this.source);
    return { md5, sizeInBytes };
  }

  // 上传文件到百炼平台并处理
  public async processToBailian(type?: 'product' | 'expiration' | 'production-date') {
    // 使用构造函数中的类型，如果没有则使用参数中的类型
    const processType = this.type || type;
    addLog('info', `开始处理文件: ${this.fileName}, 类型: ${processType}`, this.source);
    const bailianClient = BailianClient.getInstance();

    try {
      // 计算文件信息
      const { md5, sizeInBytes } = this.calculateFileInfo();

      // 申请百炼平台上传租约
      addLog('info', '申请百炼平台上传租约...', this.source);
      const leaseResponse = await bailianClient.applyFileUploadLease(
        this.fileName,
        md5,
        sizeInBytes
      );
      addLog('success', '上传租约申请成功', this.source);

      // 使用租约信息上传到百炼平台
      addLog('info', '开始上传文件到百炼平台...', this.source);
      const { url, method, headers } = leaseResponse.body.data.param;
      const bailianResponse = await fetch(url, {
        method,
        headers: {
          'X-bailian-extra': headers['X-bailian-extra'],
          'Content-Type': headers['Content-Type'],
        },
        body: this.buffer
      });

      if (!bailianResponse.ok) {
        addLog('error', `上传到百炼平台失败: ${bailianResponse.status} ${bailianResponse.statusText}`, this.source);
        throw new Error('上传到百炼平台失败');
      }
      addLog('success', '文件上传成功', this.source);

      // 添加文件到百炼平台
      addLog('info', '添加文件到百炼平台...', this.source);
      const addFileResponse = await bailianClient.addFile(leaseResponse.body.data.fileUploadLeaseId);
      const fileId = addFileResponse.body.data.fileId;
      addLog('success', `文件添加成功，ID: ${fileId}`, this.source);

      // 等待文件处理完成
      await this.waitForFileProcessing(fileId);

      // 新增3秒延时
      addLog('info', '文件处理完成，等待5秒后继续操作...', this.source);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 根据类型调用不同的识别API
      let recognition = null;
      if (processType === 'product') {
        addLog('info', '开始商品识别...', this.source);
        recognition = await getImageRecognition(fileId);
      } else if (processType === 'expiration') {
        addLog('info', '开始保质期识别...', this.source);
        recognition = await getExpirationRecognition(fileId);
      } else if (processType === 'production-date') {
        addLog('info', '开始生产日期识别...', this.source);
        recognition = await getProductionDateRecognition(fileId);
      }
      addLog('success', '识别完成', this.source);

      return { recognition };
    } catch (error) {
      addLog('error', `处理失败: ${error instanceof Error ? error.message : '未知错误'}`, this.source);
      throw error;
    }
  }

  // 等待文件处理完成
  private async waitForFileProcessing(fileId: string) {
    addLog('info', `等待文件处理完成: ${fileId}`, this.source);
    const bailianClient = BailianClient.getInstance();
    let retryCount = 0;
    const maxRetries = 100;

    while (retryCount < maxRetries) {
      try {
        const response = await bailianClient.describeFile(fileId);
        const status = response.body.data.status;

        if (status === 'FILE_IS_READY') {
          addLog('success', '文件处理完成', this.source);
          return;
        }

        if (status === 'FAILED') {
          addLog('error', '文件处理失败', this.source);
          throw new Error('文件处理失败');
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
        addLog('info', `等待文件处理中... 当前状态: ${status} (${retryCount}/${maxRetries})`, this.source);
      } catch (error) {
        addLog('error', `检查文件状态失败: ${error instanceof Error ? error.message : '未知错误'}`, this.source);
        throw error;
      }
    }

    addLog('error', '文件处理超时', this.source);
    throw new Error('文件处理超时');
  }
}