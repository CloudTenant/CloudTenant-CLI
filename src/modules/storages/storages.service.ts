/**
 * * Model
 */
import { StoragesModel } from './model/storages.model';

/**
 * * Services
 */
import { KeytarService } from '@core/keytar/keytar.service';
import { UtilService } from '@src/common/util/util.service';
import { S3ManagerService } from '@core/s3-manager/s3-manager.service';
import { BackupLinksService } from '../backup-links/backup-links.service';

/**
 * * Types
 */

import { S3Credentials } from '@src/core/s3-manager/@types';
import {
  AddNewStorageParams,
  S3AccessInfo,
  S3Storage,
  StorageStatus,
} from './@types';
import { UserChange } from '@src/common/errors';

class Class {
  /**
   * * Public methods
   */

  /**
   * * getS3Credentials()
   * ? Based on a storage id return it's credentials or false in case that they are missing
   * @param id *
   */
  async getS3Credentials(id: string): Promise<S3Credentials> {
    const { accessInfo }: { accessInfo: S3AccessInfo } = StoragesModel.raw[id];

    const endpoint: string = await KeytarService.get(
      accessInfo.endpointKeytarIdentifier,
    );
    const accessKeyId: string = await KeytarService.get(
      accessInfo.accessKeyIdKeytarIdentifier,
    );
    const secretAccessKey: string = await KeytarService.get(
      accessInfo.secretAccessKeyKeytarIdentifier,
    );

    const credentials: S3Credentials = {
      endpoint,
      accessKeyId,
      secretAccessKey,
    };

    if (endpoint && accessKeyId && credentials) {
      return credentials;
    }

    throw new UserChange(
      "Storage's credentials are missing or they couldn't be accessed",
    );
  }

  /**
   * * addS3Storage()
   * ? Get the S3 credentials and save them in using keytar.
   * ? In the same time save the keytar key name for each of the credentials inside the store
   */
  async addS3Storage(payload: AddNewStorageParams): Promise<S3Storage> {
    const {
      storageName,
      endpoint,
      accessKeyId,
      secretAccessKey,
    }: {
      storageName: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
    } = payload;

    // ? validate this credentials agains the s3
    await S3ManagerService.listBuckets({
      endpoint,
      accessKeyId,
      secretAccessKey,
    });

    const storageId: string = UtilService.generateRandomId(
      Object.keys(StoragesModel.raw),
    );

    // ? make the relational key to map credentials manager and the persistent data from store
    const endpointKeytarIdentifier = `${storageId}-endpoint`;
    const accessKeyIdKeytarIdentifier = `${storageId}-accesskeyid`;
    const secretAccessKeyKeytarIdentifier = `${storageId}-sacesskey`;

    // ? save in in credentials manager using keytar
    await KeytarService.save(endpointKeytarIdentifier, endpoint);
    await KeytarService.save(accessKeyIdKeytarIdentifier, accessKeyId);
    await KeytarService.save(secretAccessKeyKeytarIdentifier, secretAccessKey);

    const s3Storage: S3Storage = {
      id: storageId,
      accessInfo: {
        endpointKeytarIdentifier,
        accessKeyIdKeytarIdentifier,
        secretAccessKeyKeytarIdentifier,
      },
      storageName,
    };
    StoragesModel.raw[storageId] = s3Storage;

    await StoragesModel.save();

    return s3Storage;
  }

  /**
   * * listStoragesByNames()
   * ? Return an array with all the names of the available storages
   */
  listStoragesByNames(): string[] {
    const output: string[] = [];

    Object.keys(StoragesModel.raw).forEach((id: string) => {
      output.push(StoragesModel.raw[id].storageName);
    });

    return output;
  }

  /**
   * * removeStorage()
   * ? Remove a storage
   * @param id - storage id
   */
  async removeStorage(id: string): Promise<boolean> {
    // ? get the connection keys
    const {
      endpointKeytarIdentifier,
      accessKeyIdKeytarIdentifier,
      secretAccessKeyKeytarIdentifier,
    }: {
      endpointKeytarIdentifier: string;
      accessKeyIdKeytarIdentifier: string;
      secretAccessKeyKeytarIdentifier: string;
    } = StoragesModel.raw[id].accessInfo;

    // ? delete from keytar
    await KeytarService.delete(endpointKeytarIdentifier);
    await KeytarService.delete(accessKeyIdKeytarIdentifier);
    await KeytarService.delete(secretAccessKeyKeytarIdentifier);

    delete StoragesModel.raw[id];
    await StoragesModel.save();

    // ? remove the associated backup links
    await BackupLinksService.removeBackupLinksFromStorage(id);

    return true;
  }

  /**
   * * storageNameToIdMap() 
   * ? return the associated id for a storage name
   @param name - unique storage name
   */
  storageNameToIdMap(searchName: string): string | undefined {
    let output: string;
    for (let i = 0; i < Object.keys(StoragesModel.raw).length; i++) {
      const id: string = Object.keys(StoragesModel.raw)[i];
      if (StoragesModel.raw[id].storageName === searchName) {
        output = id;
        break;
      }
    }

    return output;
  }

  /**
   * * getStoragesStatus()
   * ? return the status for each storage
   */
  async getStoragesStatus(): Promise<StorageStatus[]> {
    const output: StorageStatus[] = [];
    await Promise.all(
      Object.keys(StoragesModel.raw).map(async (id: string) => {
        const storage: S3Storage = StoragesModel.raw[id];

        // ? 1. check if credentials are reachable
        let credentials: S3Credentials;
        try {
          credentials = await this.getS3Credentials(id);
        } catch (err) {}

        const credentialsAreOk: boolean = credentials ? true : false;

        const status: StorageStatus = {
          storageId: id,
          storageName: storage.storageName,
          credentialsAreOk,
          isOnline: false,
        };

        if (!credentialsAreOk) {
          output.push(status);
          return;
        }

        // ? 2. check if storage is online
        try {
          await S3ManagerService.listBuckets(credentials as S3Credentials);
          status.isOnline = true;
        } catch (err) {}

        output.push(status);
      }),
    );

    return output;
  }
}

const StoragesService = new Class();
Object.freeze(StoragesService);

export { StoragesService };
