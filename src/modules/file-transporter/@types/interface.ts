import { S3 } from 'aws-sdk';

/**
 * * Operations
 */

export interface TransportLocalToS3Params {
  s3: S3;
  filePath: string;
  bucket: string;
  fileKey: string;
}
