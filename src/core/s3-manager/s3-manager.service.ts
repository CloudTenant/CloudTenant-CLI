/**
 * * Dependencies
 */
import { S3 } from 'aws-sdk';
import * as fs from 'fs';

/**
 * * Types
 */
import {
  S3Credentials,
  TransportLocalToS3Params,
  UploadProgressCallback,
} from './@types';
import { ListBucketsOutput, ManagedUpload } from 'aws-sdk/clients/s3';

/**
 * * Error objs
 */
import { S3Error } from '@common/errors';

class Class {
  /**
   * * Public methods
   */

  /**
   * * Return an S3 instance based on a set of credentials
   * @param credentials
   */
  buildS3Client(credentials: S3Credentials): S3 {
    return new S3({
      endpoint: credentials.endpoint,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    });
  }

  /**
   * * List all the buckets from a storage
   * @param credentials
   */
  async listBuckets(credentials: S3Credentials): Promise<ListBucketsOutput> {
    try {
      const client: S3 = this.buildS3Client(credentials);
      const data: ListBucketsOutput = await client.listBuckets().promise();

      return data;
    } catch (err) {
      throw new S3Error('The bucket content could not be listed');
    }
  }

  /**
   * * Test bucket connectivity
   * @param credentials *
   */
  async pingBucket(credentials: S3Credentials, bucket: string): Promise<void> {
    try {
      const client: S3 = this.buildS3Client(credentials);
      await client.headBucket({ Bucket: bucket }).promise();
    } catch (err) {
      throw new S3Error(
        'The bucket cannot be accessed. Check your internet connection, credentials or bucket permissions',
      );
    }
  }

  /**
   * * Upload a file from local file system to S3
   * @param payload
   * @param cb - will be called each time a chunk was READ from the local read stream
   */
  localToS3(
    payload: TransportLocalToS3Params,
    cb?: UploadProgressCallback,
  ): Promise<ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(payload.filePath);

      stream
        .on('error', (err) => {
          return reject(err);
        })

        .on('data', (chunk: string | Buffer) => {
          if (cb) {
            cb(chunk.length);
          }
        });

      const params = {
        Bucket: payload.bucket,
        Key: payload.fileKey,
        Body: stream,
      };

      const options = { partSize: 5 * 1024 * 1024, queueSize: 4 };

      payload.s3.upload(
        params,
        options,
        (err, data: ManagedUpload.SendData) => {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        },
      );
    });
  }
}

const S3ManagerService = new Class();
Object.freeze(S3ManagerService);

export { S3ManagerService };
