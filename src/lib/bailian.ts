import bailian20231229, {ApplyFileUploadLeaseRequest, AddFileRequest} from '@alicloud/bailian20231229';
import * as $OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';

export class BailianClient {
  private static instance: BailianClient;
  private client: bailian20231229;

  private constructor() {
    // 创建配置对象
    let config = new $OpenApi.Config({
        // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID。
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET。
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      });
    config.endpoint = `bailian.cn-beijing.aliyuncs.com`;
    // @ts-ignore
    this.client = new bailian20231229(config);
  }

  public static getInstance(): BailianClient {
    if (!BailianClient.instance) {
      BailianClient.instance = new BailianClient();
    }
    return BailianClient.instance;
  }

  public async applyFileUploadLease(fileName: string, md5: string, sizeInBytes: string): Promise<any> {
    try {
      const request = new ApplyFileUploadLeaseRequest({
        categoryType: 'SESSION_FILE',
        fileName,
        md5,
        sizeInBytes
      });
      const runtime = new Util.RuntimeOptions({});
      const headers = {};

      const response = await this.client.applyFileUploadLeaseWithOptions(
        'default',
        'llm-7847pixtju2bl050',
        request,
        headers,
        runtime
      );

      return response;
    } catch (error: any) {
      console.error('文件上传租约申请失败:', error.message);
      if (error.data?.Recommend) {
        console.error('诊断信息:', error.data.Recommend);
      }
      throw error;
    }
  }
  public async addFile(leaseId: string): Promise<any> {
    const request = new AddFileRequest({
      categoryId: 'default',
      categoryType: 'SESSION_FILE',
      leaseId,
      parser: 'DASHSCOPE_DOCMIND'
    })

    try {
      const response = await this.client.addFile('llm-7847pixtju2bl050', request);
      return response;
    } catch (error: any) {
      console.error('文件添加失败:', error.message);
      if (error.data?.Recommend) {
        console.error('诊断信息:', error.data.Recommend);
      }
      throw error;
    }
  }
  public async describeFile(fileId: string): Promise<any> {
    try {
      const runtime = new Util.RuntimeOptions({});
      const headers = {};

      const response = await this.client.describeFileWithOptions(
        'llm-7847pixtju2bl050',
        fileId,
        headers,
        runtime
      );

      return response;
    } catch (error: any) {
      console.error('文件查询失败:', error.message);
      if (error.data?.Recommend) {
        console.error('诊断信息:', error.data.Recommend);
      }
      throw error;
    }
  }
}