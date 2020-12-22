/**
 * * Dependencies
 */
import { join } from 'path';
import { WriteStream, createWriteStream } from 'fs';
import { S3, AWSError } from 'aws-sdk';
import {
  Bucket,
  CommonPrefix,
  CommonPrefixList,
  HeadObjectOutput,
  ListBucketsOutput,
  ObjectList,
  PutObjectRequest,
} from 'aws-sdk/clients/s3';

/**
 * * Types
 */
import { ListObjectsParams, S3Credentials } from './@types';

/**
 * * Error objs
 */
import { PlatformError, S3Error } from '@common/errors';

class Class {
  // *
  #buildS3Client = (credentials: S3Credentials): S3 => {
    return new S3({
      endpoint: credentials.endpoint,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    });
  };

  /**
   * * List all the buckets from a storage
   * @param credentials
   */
  public async listBuckets(
    credentials: S3Credentials,
  ): Promise<ListBucketsOutput> {
    try {
      const client: S3 = this.#buildS3Client(credentials);
      const data: ListBucketsOutput = await client.listBuckets().promise();

      return data;
    } catch (err) {
      throw new S3Error('The bucket content could not be listed');
    }
  }
}

const S3ManagerService = new Class();
Object.freeze(S3ManagerService);

export { S3ManagerService };
