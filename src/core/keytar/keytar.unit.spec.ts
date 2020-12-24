/**
 * * Dependencies
 */
import * as keytar from 'keytar';

/**
 * * Services
 */
import { KeytarService } from './keytar.service';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

describe('KeytarService Unit Testing', () => {
  const dummyStorage: any = {};

  const dummyServiceName: string = APP_CONSTANTS.appName;
  const dummyAccountName: string = 'DemoAcc';
  const dummyPassword: string = 'eee';

  beforeAll(() => {
    jest.spyOn(keytar, 'setPassword').mockImplementation(
      (service: string, account: string, password: string) =>
        new Promise((resolve) => {
          dummyStorage[`${service}/${account}`] = password;
          resolve();
        }),
    );

    jest
      .spyOn(keytar, 'getPassword')
      .mockImplementation(
        (service: string, account: string) =>
          new Promise((resolve) =>
            resolve(dummyStorage[`${service}/${account}`]),
          ),
      );

    jest.spyOn(keytar, 'deletePassword').mockImplementation(
      (service: string, account: string) =>
        new Promise((resolve) => {
          delete dummyStorage[`${service}/${account}`];
          resolve(true);
        }),
    );
  });

  // *
  it('It should be able to save the credentials', async () => {
    await KeytarService.save(dummyAccountName, dummyPassword);

    expect(dummyStorage[`${dummyServiceName}/${dummyAccountName}`]).toBe(
      dummyPassword,
    );
    expect(Object.keys(dummyStorage).length).toBe(1);
  });

  // *
  it('It should be able to get the credentials', async () => {
    const receivedPassword = await KeytarService.get(dummyAccountName);

    expect(Object.keys(dummyStorage).length).toBe(1);
    expect(receivedPassword).toBe(dummyPassword);
  });

  // *
  it('It should be able to delete the credentials', async () => {
    await KeytarService.delete(dummyAccountName);
    expect(Object.keys(dummyStorage).length).toBe(0);
  });
});
