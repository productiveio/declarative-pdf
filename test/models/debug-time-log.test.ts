/**
 * @jest-environment jest-environment-node
 */

import TimeLogger from '@app/models/debug-time-log';

describe('TimeLogger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleSpy.mockRestore();
  });

  test('should log individual times when not aggregated', () => {
    const logger = new TimeLogger({ aggregated: false });

    logger.startSession('Test Session');
    logger.add('Task 1');
    jest.advanceTimersByTime(100);
    logger.end('Task 1');
    logger.endSession();
    expect(consoleSpy).toHaveBeenCalledWith('Time log: Task 1 --==+> 100ms');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );
  });

  test('should create aggregated report', () => {
    const logger = new TimeLogger({ aggregated: true });

    logger.startSession('Test Session');

    logger.add('Task 1');
    jest.advanceTimersByTime(100);
    logger.end('Task 1');

    logger.add('Task 2');
    jest.advanceTimersByTime(200);
    logger.end('Task 2');

    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      [
        'Time log report:',
        '================',
        '   33.33% | 100ms | Task 1',
        '   66.67% | 200ms | Task 2',
        '  ========================',
        '            300ms | Test Session',
      ].join('\n')
    );
  });

  test('should handle multiple adds before end', () => {
    const logger = new TimeLogger({ aggregated: false });

    logger.startSession('Test Session');
    logger.add('Task 1');

    jest.advanceTimersByTime(100);
    logger.add('Task 1'); // Should log the first interval

    jest.advanceTimersByTime(100);
    logger.end('Task 1'); // Should log the second interval

    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });

  test('should handle close to zero times', () => {
    const logger = new TimeLogger({ aggregated: false });

    logger.startSession('Test Session');

    logger.add('Task 1');
    jest.advanceTimersByTime(0);
    logger.end('Task 1');

    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith('Time log: Task 1 --==+> 0ms');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 0ms'
    );
  });

  test('should handle close to zero times when aggregated', () => {
    const logger = new TimeLogger({ aggregated: true });

    logger.startSession('Test Session');

    logger.add('Task 1');
    jest.advanceTimersByTime(0);
    logger.end('Task 1');

    logger.add('Task 2');
    jest.advanceTimersByTime(0);
    logger.end('Task 2');

    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      [
        'Time log report:',
        '================',
        '    0.00% | 0ms | Task 1',
        '    0.00% | 0ms | Task 2',
        '  ======================',
        '            0ms | Test Session',
      ].join('\n')
    );
  });

  test('should handle start and end without adds', () => {
    const logger = new TimeLogger({ aggregated: false });

    logger.startSession('Test Session');
    jest.advanceTimersByTime(100);
    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );
  });

  test('should handle start and end without adds when aggregated', () => {
    const logger = new TimeLogger({ aggregated: true });

    logger.startSession('Test Session');
    jest.advanceTimersByTime(100);
    logger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );
  });
});
