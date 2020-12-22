/**
 * * Mock data
 */

const mockedListBucketOutput: ListBucketsOutput = {
  Buckets: [],
};

const mockDate = new Date();

const mockedListObjectsOutput: ListObjectsOutput = {
  IsTruncated: false,
  Contents: [{ Key: 'my-dummy-obj', Size: 20, LastModified: mockDate }],
  NextMarker: '',
};

// ? some s3 serevices may return data in a different format, and requires other method of interogation
const s3ContentInDifferentFormat: any = {
  IsTruncated: false,
};

const endCallback = () => {
  return {
    createReadStream: () => {
      return {
        on: (err: any, cb: Function) => {
          return {
            on: (end: any, cb: Function) => {
              cb();
              return {
                pipe: () => {},
              };
            },
          };
        },
      };
    },
  };
};

const errCallback = () => {
  return {
    createReadStream: () => {
      return {
        on: (err: any, cb: Function) => {
          cb();
          return {
            on: (end: any, cb: Function) => {
              return {
                pipe: () => {},
              };
            },
          };
        },
      };
    },
  };
};

const mockedS3 = {
  listBuckets: () => {
    return {
      promise: (): ListBucketsOutput => mockedListBucketOutput,
    };
  },
  listObjects: (params: any) => {
    return {
      promise: (): ListObjectsOutput => mockedListObjectsOutput,
    };
  },

  upload: (params: any) => {
    return {
      promise: () => true,
    };
  },

  getObject: endCallback,
};

// * functions that will make the s3manager to return errors
const s3DifferentContentFunction = (params: any) => {
  return {
    promise: (): ListObjectsOutput => s3ContentInDifferentFormat,
  };
};

const fThatThrowsError = () => {
  return {
    promise: () => {
      throw new Error();
    },
  };
};

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn().mockImplementation(() => {
      return mockedS3;
    }),
  };
});

const trueExist = () => true;
const falseExist = () => false;

const mockedFs = {
  existsSync: trueExist,
  createWriteStream: () => {},
};

jest.mock('fs', () => {
  return mockedFs;
});

/**
 * * Services
 */

import { S3ManagerService } from './s3-manager.service';

/**
 * *  Types
 */
import { ListBucketsOutput, ListObjectsOutput } from 'aws-sdk/clients/s3';
import { S3Error } from '@src/common/errors';

describe('S3ManagerService Unit Testing', () => {
  const service = S3ManagerService;

  // * listBuckets()
  it('listBuckets() - it should list buckets', async () => {
    const data: ListBucketsOutput = await service.listBuckets({
      endpoint: 'e',
      accessKeyId: 'a',
      secretAccessKey: 's',
    });

    expect(data).toBeDefined();
  });

  it('listBuckets() - it should catch the error', async () => {
    // ? replace the original function with the function that returns data in a different format
    const originalF: any = mockedS3.listBuckets;
    mockedS3.listBuckets = fThatThrowsError;

    let throwThis = async () => {
      await service.listBuckets({
        endpoint: 'e',
        accessKeyId: 'a',
        secretAccessKey: 's',
      });
    };

    const spy = jest.fn();
    await throwThis().catch(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    expect(spy.mock.calls[0][0] instanceof S3Error).toBeTruthy();

    // ? clean up
    mockedS3.listBuckets = originalF;
  });
});
