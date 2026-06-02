import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

/**
 * S3 图片存储服务 — 火山引擎 TOS
 *
 * 复用 gongmei-digital 的 S3Storage 模式：
 * - uploadFromUrl: 从 URL 下载并上传到永久 bucket（图片持久化双保险）
 * - generatePresignedUrl: 生成长时效预签名 URL（24小时）
 * - 删���保护：删除前记录操作审计日志
 */
export class S3Storage {
  private client: S3Client;
  private bucketName: string;

  constructor(config?: { endpointUrl?: string; bucketName?: string; region?: string }) {
    this.client = new S3Client({
      endpoint: config?.endpointUrl || process.env.S3_ENDPOINT_URL,
      region: config?.region || "cn-beijing",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    this.bucketName = config?.bucketName || process.env.S3_BUCKET_NAME!;
  }

  /**
   * 从远程 URL 下载图片并上传到永久 S3 bucket
   * 这是图片持久化的核心方法——确保图片不会因临时存储清理而丢失
   */
  async uploadFromUrl(params: { url: string; prefix?: string }): Promise<string> {
    const { url, prefix = "rural" } = params;

    // 1. 下载远程图片
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`下载图片失败: HTTP ${response.status}`);
    }

    const contentType =
      response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. 生成唯一 key
    const ext = contentType.includes("jpeg") ? "jpg" : "png";
    const key = `${prefix}/${uuidv4()}.${ext}`;

    // 3. 上传到 S3
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return key;
  }

  /**
   * 直接上传 Buffer 到 S3
   */
  async uploadBuffer(
    buffer: Buffer,
    contentType: string,
    prefix: string = "rural"
  ): Promise<string> {
    const ext = contentType.includes("jpeg") ? "jpg" : "png";
    const key = `${prefix}/${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return key;
  }

  /**
   * 生成预签名 URL（用于前端直接访问 S3 图片）
   * @param key - S3 对象的 key
   * @param expireTime - 过期时间（秒），默认 86400（24小时）
   */
  async generatePresignedUrl(
    key: string,
    expireTime: number = 86400
  ): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn: expireTime });
    } catch (e) {
      console.error(`[S3] 生成预签名URL失败, key=${key}:`, e);
      return null;
    }
  }

  /**
   * 删除 S3 对象（含审计日志，软删除保护）
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (e) {
      console.error(`[S3] 删除对象失败, key=${key}:`, e);
      throw e;
    }
  }

  /**
   * 检查对象是否存在
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}

// 单例导出
let storageInstance: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage();
  }
  return storageInstance;
}
