import { PromiseQueue } from './promise-queue';

describe('PromiseQueue Unit Testing', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('The functions passed should execute with within the correct scope and with the correct args', () => {
    const mock = jest.fn();
    mock.call = jest.fn();

    PromiseQueue.schedule(mock, this, 1, 2);

    expect(mock.call).toHaveBeenCalledWith(this, 1, 2);
  });
});
