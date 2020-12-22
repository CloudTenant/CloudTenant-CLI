/**
 * * Dependencies
 */
import { existsSync, mkdirSync, rmdirSync } from 'fs';

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
    if (existsSync(path)) {
      return false;
    }

    mkdirSync(path);

    return true;
  }

  /**
   * * Remove a given folder by it's path
   * ? return true or false based on the output of the action
   * @param path - path to remove
   */
  removeFolder = (path: string): boolean => {
    if (!existsSync(path)) {
      return false;
    }

    rmdirSync(path, { recursive: true });

    return true;
  };
}

const UtilService = new Class();

Object.freeze(UtilService);

export { UtilService };
