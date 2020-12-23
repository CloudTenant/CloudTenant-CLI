/**
 * * Dependencies
 */
import { S3 } from 'aws-sdk';

/**
 * * Types
 */
import { S3Credentials } from './@types';
import { ListBucketsOutput } from 'aws-sdk/clients/s3';

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
}

const S3ManagerService = new Class();
Object.freeze(S3ManagerService);

export { S3ManagerService };
