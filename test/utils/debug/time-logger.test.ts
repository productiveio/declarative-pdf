/**
 * @jest-environment jest-environment-node
 */

import TimeLogger from '@app/utils/debug/time-logger';

describe('TimeLogger', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should log with wonky calls', () => {
    const logger = new TimeLogger();

    logger.session().start('Test Session');

    logger.group().start('Solo Group');
    jest.advanceTimersByTime(30);
    logger.group().end();

    logger.subgroup().start('Subgroup without group 1');
    jest.advanceTimersByTime(10);
    logger.subgroup().start('Subgroup without group 2');
    jest.advanceTimersByTime(10);
    logger.group().end();

    logger.item().start('Item without stuff 1');
    jest.advanceTimersByTime(10);
    logger.item().start('Item without stuff 2');
    jest.advanceTimersByTime(10);
    logger.group().end();

    logger.item().start('Solo item without stuff');
    jest.advanceTimersByTime(10);
    logger.item().end();
    logger.subgroup().end();
    jest.advanceTimersByTime(20);

    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      [
        '100ms | Test Session',
        '====================',
        ' 30ms | 30.0% | Solo Group',
        ' 20ms | 20.0% | Group',
        ' 10ms | 10.0% |   Subgroup without group 1',
        ' 10ms | 10.0% |   Subgroup without group 2',
        ' 20ms | 20.0% | Group',
        ' 20ms | 20.0% |   Subgroup',
        ' 10ms | 10.0% |     Item without stuff 1',
        ' 10ms | 10.0% |     Item without stuff 2',
        ' 30ms | 30.0% | Group',
        ' 10ms | 10.0% |   Subgroup',
        ' 10ms | 10.0% |     Solo item without stuff',
      ].join('\n')
    );
  });

  test('should handle empty session', () => {
    const logger = new TimeLogger();
    logger.session().start('Empty Session');
    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      ['0ms | Empty Session', '==================='].join('\n')
    );
  });

  test('should handle nested empty phases', () => {
    const logger = new TimeLogger();
    logger.session().start('Nested Empty');
    logger.group().start('Empty Group');
    logger.subgroup().start('Empty Subgroup');
    logger.subgroup().end();
    logger.group().end();
    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      [
        '0ms | Nested Empty',
        '==================',
        '0ms |  0.0% | Empty Group',
        '0ms |  0.0% |   Empty Subgroup',
      ].join('\n')
    );
  });

  test('should handle out of order ends', () => {
    const logger = new TimeLogger();
    logger.session().start('Out Of Order');
    logger.group().start('Group 1');
    logger.subgroup().start('Subgroup 1');
    logger.item().start('Item 1');

    // End session without properly ending other nodes
    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      [
        '0ms | Out Of Order',
        '==================',
        '0ms |  0.0% | Group 1',
        '0ms |  0.0% |   Subgroup 1',
        '0ms |  0.0% |     Item 1',
      ].join('\n')
    );
  });

  test('should handle restarting nodes', () => {
    const logger = new TimeLogger();
    logger.session().start('Restart Test');

    logger.group().start('Group 1');
    jest.advanceTimersByTime(10);
    // Restart group without ending
    logger.group().start('Group 2');
    jest.advanceTimersByTime(10);
    logger.group().end();

    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      [
        '20ms | Restart Test',
        '===================',
        '10ms | 50.0% | Group 1',
        '10ms | 50.0% | Group 2',
      ].join('\n')
    );
  });

  test('should handle undefined names', () => {
    const logger = new TimeLogger();
    logger.session().start('');
    logger.group().start('');
    logger.subgroup().start('');
    jest.advanceTimersByTime(10);
    logger.subgroup().end();
    logger.group().end();
    logger.session().end();

    const report = logger.getReport();
    expect(report).toBe(
      [
        '10ms | Session',
        '==============',
        '10ms |  100% | Group',
        '10ms |  100% |   Subgroup',
      ].join('\n')
    );
  });
});
