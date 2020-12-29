/**
 * * Test Target
 */
import { KeytarService } from '../../src/core/keytar/keytar.service';

describe('KeytarService - Integration Tests', () => {
  // *
  it('save(),get(),delete()', async () => {
    await KeytarService.save('key', 'value');

    await expect(KeytarService.get('key')).resolves.toBe('value');

    await KeytarService.delete('key');

    expect(await KeytarService.get('key')).toBeNull();
  });
});
