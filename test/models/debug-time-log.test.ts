/**
 * @jest-environment jest-environment-node
 */

import TimeLogger from '@app/models/debug-time-log';

describe('TimeLogger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    TimeLogger.setOptions({ active: false, aggregated: false });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should not log when inactive', () => {
    TimeLogger.startSession('Test Session');
    TimeLogger.add('Task 1');
    TimeLogger.end('Task 1');
    TimeLogger.endSession();

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('should log individual times when not aggregated', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: false });

    TimeLogger.startSession('Test Session');
    TimeLogger.add('Task 1');
    jest.advanceTimersByTime(100);
    TimeLogger.end('Task 1');
    TimeLogger.endSession();
    expect(consoleSpy).toHaveBeenCalledWith('Time log: Task 1 --==+> 100ms');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );

    jest.useRealTimers();
  });

  test('should create aggregated report', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: true });

    TimeLogger.startSession('Test Session');

    TimeLogger.add('Task 1');
    jest.advanceTimersByTime(100);
    TimeLogger.end('Task 1');

    TimeLogger.add('Task 2');
    jest.advanceTimersByTime(200);
    TimeLogger.end('Task 2');

    TimeLogger.endSession();

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

    jest.useRealTimers();
  });

  test('should handle multiple adds before end', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: false });

    TimeLogger.startSession('Test Session');
    TimeLogger.add('Task 1');

    jest.advanceTimersByTime(100);
    TimeLogger.add('Task 1'); // Should log the first interval

    jest.advanceTimersByTime(100);
    TimeLogger.end('Task 1'); // Should log the second interval

    TimeLogger.endSession();

    expect(consoleSpy).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  test('should handle close to zero times', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: false });

    TimeLogger.startSession('Test Session');

    TimeLogger.add('Task 1');
    jest.advanceTimersByTime(0);
    TimeLogger.end('Task 1');

    TimeLogger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith('Time log: Task 1 --==+> 0ms');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 0ms'
    );

    jest.useRealTimers();
  });

  test('should handle close to zero times when aggregated', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: true });

    TimeLogger.startSession('Test Session');

    TimeLogger.add('Task 1');
    jest.advanceTimersByTime(0);
    TimeLogger.end('Task 1');

    TimeLogger.add('Task 2');
    jest.advanceTimersByTime(0);
    TimeLogger.end('Task 2');

    TimeLogger.endSession();

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

    jest.useRealTimers();
  });

  test('should handle start and end without adds', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: false });

    TimeLogger.startSession('Test Session');
    jest.advanceTimersByTime(100);
    TimeLogger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );

    jest.useRealTimers();
  });

  test('should handle start and end without adds when aggregated', () => {
    jest.useFakeTimers();
    TimeLogger.setOptions({ active: true, aggregated: true });

    TimeLogger.startSession('Test Session');
    jest.advanceTimersByTime(100);
    TimeLogger.endSession();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Time log: Test Session --==+> 100ms'
    );

    jest.useRealTimers();
  });
});
