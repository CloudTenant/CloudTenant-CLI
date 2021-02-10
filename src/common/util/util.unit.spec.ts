/**
 * * Services
 */
import { exception } from 'console';
import { UtilService } from './util.service';

/**
 * * Constants
 */

describe('UtilService Unit Testing', () => {
  describe('getRandomId', () => {
    // *
    it('It should get a random number', () => {
      const id = UtilService.generateRandomId();
      expect(id).toBeDefined();
    });

    // *
    it('It should be able to recall if the first value is not unique in a set', () => {
      jest
        .spyOn(global.Math, 'random')
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.3);

      expect(UtilService.generateRandomId()).toBe('i'); // ? known value for 0.5

      expect(UtilService.generateRandomId(['i']) !== 'i').toBeTruthy();
      expect(global.Math.random).toHaveBeenCalledTimes(3);
    });
  });
});
