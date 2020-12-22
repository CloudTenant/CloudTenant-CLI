/**
 * * Services
 */

import { StoreService } from '@core/store/store.service';

export abstract class BaseModel {
  constructor(
    private readonly storeService: StoreService,
    private readonly storeKey: string,
  ) {}

  public async save(value: any): Promise<boolean> {
    return this.storeService.set(this.storeKey, value);
  }

  public delete() {
    this.storeService.delete(this.storeKey);
  }

  public get(): any {
    return this.storeService.get(this.storeKey);
  }
}
