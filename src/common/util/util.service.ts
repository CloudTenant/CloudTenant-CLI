/**
 * * Dependencies
 */
import * as fs from 'fs';

class Class {
  /**
   * * Generate a random id that is unique in a set
   * @param set - optional set to check if the id is unique
   */
  generateRandomId(set?: string[]): any {
    const id = Math.random().toString(36).slice(2);

    if (Array.isArray(set) && set.length > 0 && set.indexOf(id) !== -1) {
      return this.generateRandomId();
    }

    return id;
  }

  /**
   * * Create a folder based on a given path
   * ? will return true or false, based on the action output
   * @param path - path to create
   */
  createFolder(path: string): boolean {
    if (fs.existsSync(path)) {
      return false;
    }

    fs.mkdirSync(path);

    return true;
  }

  /**
   * * Remove a given folder by it's path
   * ? return true or false based on the output of the action
   * @param path - path to remove
   */
  removeFolder(path: string): boolean {
    if (!fs.existsSync(path)) {
      return false;
    }

    fs.rmSync(path, { recursive: true });

    return true;
  }

  /**
   * * Remove all content from a file
   * ? return true or false based on the action output
   * @param path - file path
   */
  emptyFileContent(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.writeFile(path, '', (err: NodeJS.ErrnoException | null) => {
        if (err) {
          return resolve(false);
        }
        resolve(true);
      });
    });
  }

  /**
   * * Bytes for humans
   * @param bytes
   */
  bytesToSize(bytes: number) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
    return Math.round(bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }
}

const UtilService = new Class();

Object.freeze(UtilService);

export { UtilService };
