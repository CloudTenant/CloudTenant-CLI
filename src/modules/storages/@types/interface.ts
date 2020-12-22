/**
 * * S3 Storage
 */
export interface S3AccessInfo {
  endpointKeytarIdentifier: string;
  accessKeyIdKeytarIdentifier: string;
  secretAccessKeyKeytarIdentifier: string;
}

export interface S3Storage {
  id: string; // ? unique
  accessInfo: S3AccessInfo;
  storageName: string; // ? unique
}

export interface Storages {
  [id: string]: S3Storage;
}

/**
 * * Operations
 */
export interface AddNewStorageParams {
  storageName: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * * Computed values
 */
export interface StorageStatus {
  storageId: string;
  storageName: string;
  credentialsAreOk: boolean; // ? credentials are reachable
  isOnline: boolean; // ? s3 storage is online and reachable
}
