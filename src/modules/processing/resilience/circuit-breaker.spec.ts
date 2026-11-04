import { CircuitBreaker } from './circuit-breaker';

// Keep asynchronous logger transports outside the watchdog lifecycle test.
jest.mock('src/common/services/custom-logger.service', () => ({
  CustomLoggerService: jest.fn(() => ({
    log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  })),
}));

describe('CircuitBreaker watchdog lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('clears the watchdog after success', async () => {
    const breaker = new CircuitBreaker('test', { timeout: 300000 });
    await expect(breaker.execute(async () => 42)).resolves.toBe(42);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears the watchdog after an operation fails', async () => {
    const breaker = new CircuitBreaker('test', { timeout: 300000 });
    await expect(breaker.execute(async () => { throw new Error('failure'); }))
      .rejects.toThrow('failure');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('still rejects operations that exceed the deadline', async () => {
    const breaker = new CircuitBreaker('test', { timeout: 50 });
    const result = expect(breaker.execute(() => new Promise(() => {})))
      .rejects.toThrow('Operation timeout after 50ms');
    await jest.advanceTimersByTimeAsync(50);
    await result;
    expect(jest.getTimerCount()).toBe(0);
  });
});
