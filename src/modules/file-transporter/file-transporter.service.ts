/**
 * * Dependencies
 */
import { ManagedUpload } from 'aws-sdk/clients/s3';
import * as fs from 'fs';

/**
 * * Types
 */
import { TransportLocalToS3Params, UploadProgressCallback } from './@types';

export class Class {
  localToS3(
    payload: TransportLocalToS3Params,
    cb: UploadProgressCallback,
  ): Promise<ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(payload.filePath);

      stream
        .on('error', (err) => {
          return reject(err);
        })

        .on('data', (chunk: string | Buffer) => {
          cb(chunk.length);
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
        function (err, data: ManagedUpload.SendData) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        },
      );
    });
  }
}

const FileTransporterService = new Class();
Object.freeze(FileTransporterService);

export { FileTransporterService };
