/**
 * * Mocks
 */

// * Aws SDK
const mockedAwsSdk: any = {
  listBuckets: (): any => undefined,
  upload: (params: any, option: any, cb: any): any => undefined,
  headBucket: (): any => undefined,
};

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn().mockImplementation(() => {
      return mockedAwsSdk;
    }),
  };
});

// * fs
const mockedFs = {
  createReadStream: (): any => undefined,
};

jest.mock('fs', () => {
  return mockedFs;
});

/**
 * * Test Target
 */

import { S3ManagerService } from './s3-manager.service';

/**
 * *  Types
 */
import { ListBucketsOutput, ListObjectsOutput } from 'aws-sdk/clients/s3';
import { S3Error } from '../../common/errors';
import { rejects } from 'assert';

describe('S3ManagerService Unit Testing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listBuckets()', () => {
    // *
    it('Should list buckets', async () => {
      jest
        .spyOn(mockedAwsSdk, 'listBuckets')
        .mockReturnValue({ promise: () => 'data' });

      const data: ListBucketsOutput = await S3ManagerService.listBuckets({
        endpoint: 'e',
        accessKeyId: 'a',
        secretAccessKey: 's',
      });

      expect(data).toBeDefined();
    });

    // *
    it("Should throw new error if the content can't be listed", async () => {
      // ? replace the original function with the function that returns data in a different format
      jest.spyOn(mockedAwsSdk, 'listBuckets').mockImplementation(() => {
        throw new Error();
      });

      //@ts-ignore
      await expect(S3ManagerService.listBuckets()).rejects.toThrow(S3Error);
    });
  });

  describe('pingBucket()', () => {
    // *
    it('Should ping the bucket', async () => {
      jest
        .spyOn(mockedAwsSdk, 'headBucket')
        .mockReturnValue({ promise: () => true });

      expect(
        async () =>
          await S3ManagerService.pingBucket(
            {
              endpoint: 'e',
              accessKeyId: 'a',
              secretAccessKey: 's',
            },
            'my-bucket',
          ),
      ).not.toThrow();
    });

    // *
    it("Should throw new error if the bucket can't be accessed", async () => {
      // ? replace the original function with the function that returns data in a different format
      jest.spyOn(mockedAwsSdk, 'listBuckets').mockImplementation(() => {
        throw new Error();
      });

      //@ts-ignore
      await expect(S3ManagerService.pingBucket()).rejects.toThrow(S3Error);
    });
  });
});
