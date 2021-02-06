/**
 * * Dependencies
 */
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { parse } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * * Test Data
 */
const TEST_CONFIG = parse(
  fs.readFileSync(path.resolve(process.cwd(), '.env.test')),
);

const testData = (key: string) => process.env[key] || TEST_CONFIG[key];

/**
 * * Test Target
 */
import { S3ManagerService } from '../../src/core/s3-manager/s3-manager.service';

describe('FileTransporterService - Integration Tests', () => {
  /**
   * * Build the S3 clients and the file to be uploaded
   */

  describe('localToS3()', () => {
    const FILE_NAME = 'file-to-upload.txt';
    const DUMMY_FILE_PATH = path.resolve(
      process.cwd(),
      'test-placeholder',
      `./${FILE_NAME}`,
    );

    beforeAll(() => {
      fs.writeFileSync(DUMMY_FILE_PATH, 'dummy-text');
    });

    afterAll(() => {
      fs.rmSync(DUMMY_FILE_PATH);

      s3Providers.forEach(async (provider: string) => {
        const s3 = new S3({
          endpoint: testData(provider + '_endpoint'),
          accessKeyId: testData(provider + '_accessKeyId'),
          secretAccessKey: testData(provider + '_secretAccessKey'),
        });

        await s3
          .deleteObject({
            Bucket: testData(provider + '_bucket'),
            Key: FILE_NAME,
          })
          .promise();
      });
    });

    const s3Providers: string[] = ['do'];

    it.each(s3Providers)(
      'Should upload a file to %s and monitor the progress',
      async (provider) => {
        const s3 = new S3({
          endpoint: testData(provider + '_endpoint'),
          accessKeyId: testData(provider + '_accessKeyId'),
          secretAccessKey: testData(provider + '_secretAccessKey'),
        });

        const bucket: string = testData(provider + '_bucket');

        const spy = jest.fn();

        const data: ManagedUpload.SendData = await S3ManagerService.localToS3(
          {
            s3,
            filePath: DUMMY_FILE_PATH,
            bucket,
            fileKey: FILE_NAME,
          },
          spy,
        );

        expect(data).toBeDefined();
        expect(spy).toHaveBeenCalled();
      },
    );
  });
});
