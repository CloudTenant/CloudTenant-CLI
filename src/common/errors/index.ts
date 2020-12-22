export class CustomError extends Error {
  isCustom = true;

  constructor() {
    super();
  }
}

export class ConfigError extends CustomError {
  constructor(msg: string) {
    super();
    this.name = ConfigError.name;
    this.message = msg;
  }
}

export class PlatformError extends CustomError {
  constructor(msg: string) {
    super();
    this.name = PlatformError.name;
    this.message = msg;
  }
}

export class S3Error extends CustomError {
  constructor(msg: string) {
    super();
    this.name = S3Error.name;
    this.message = msg;
  }
}

/**
 * * UserChange
 * ? This error class is used to indicate, that the user has changed something that leads to an error
 * ? this user change may be normal(a folder delete) or abnormal (remove applicaiton's data)
 */
export class UserChange extends CustomError {
  constructor(msg: string) {
    super();
    this.name = UserChange.name;
    this.message = msg;
  }
}

export class BackupLinksError extends CustomError {
  constructor(msg: string) {
    super();
    this.name = BackupLinksError.name;
    this.message = msg;
  }
}
