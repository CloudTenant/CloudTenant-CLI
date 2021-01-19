/**
 * * Services
 */

import { StoreService } from '@core/store/store.service';

export abstract class BaseModel {
  constructor(
    private readonly storeService: StoreService,
    private readonly storeKey: string,
  ) {}

  async save(value: any): Promise<boolean> {
    return this.storeService.set(this.storeKey, value);
  }

  delete() {
    this.storeService.delete(this.storeKey);
  }

  get(): any {
    return this.storeService.get(this.storeKey);
  }

  get dbFilePath(): string {
    return this.storeService.storeFilePath;
  }
}
