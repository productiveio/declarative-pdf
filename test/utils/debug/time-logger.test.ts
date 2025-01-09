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

    logger.level1().start('Solo Group');
    jest.advanceTimersByTime(30);
    logger.level1().end();

    logger.level2().start('Subgroup without group 1');
    jest.advanceTimersByTime(10);
    logger.level2().start('Subgroup without group 2');
    jest.advanceTimersByTime(10);
    logger.level1().end();

    logger.level3().start('Item without stuff 1');
    jest.advanceTimersByTime(10);
    logger.level3().start('Item without stuff 2');
    jest.advanceTimersByTime(10);
    logger.level1().end();

    logger.level3().start('Solo item without stuff');
    jest.advanceTimersByTime(10);
    logger.level3().end();
    logger.level2().end();
    jest.advanceTimersByTime(20);

    logger.session().end();

    expect(logger.report).toBe(
      [
        '100ms | Test Session',
        '====================',
        ' 30ms | 30.0% | Solo Group',
        ' 20ms | 20.0% | Level 1',
        ' 10ms | 10.0% |   Subgroup without group 1',
        ' 10ms | 10.0% |   Subgroup without group 2',
        ' 20ms | 20.0% | Level 1',
        ' 20ms | 20.0% |   Level 2',
        ' 10ms | 10.0% |     Item without stuff 1',
        ' 10ms | 10.0% |     Item without stuff 2',
        ' 30ms | 30.0% | Level 1',
        ' 10ms | 10.0% |   Level 2',
        ' 10ms | 10.0% |     Solo item without stuff',
      ].join('\n')
    );
  });

  test('should handle empty session', () => {
    const logger = new TimeLogger();
    logger.session().start('Empty Session');
    logger.session().end();

    expect(logger.report).toBe(['0ms | Empty Session', '==================='].join('\n'));
  });

  test('should handle nested empty phases', () => {
    const logger = new TimeLogger();
    logger.session().start('Nested Empty');
    logger.level1().start('Empty Group');
    logger.level2().start('Empty Subgroup');
    logger.level2().end();
    logger.level1().end();
    logger.session().end();

    expect(logger.report).toBe(
      ['0ms | Nested Empty', '==================', '0ms |  0.0% | Empty Group', '0ms |  0.0% |   Empty Subgroup'].join(
        '\n'
      )
    );
  });

  test('should handle out of order ends', () => {
    const logger = new TimeLogger();
    logger.session().start('Out Of Order');
    logger.level1().start('Group 1');
    logger.level2().start('Subgroup 1');
    logger.level3().start('Item 1');

    // End session without properly ending other nodes
    logger.session().end();

    expect(logger.report).toBe(
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

    logger.level1().start('Group 1');
    jest.advanceTimersByTime(10);
    // Restart group without ending
    logger.level1().start('Group 2');
    jest.advanceTimersByTime(10);
    logger.level1().end();

    logger.session().end();

    expect(logger.report).toBe(
      ['20ms | Restart Test', '===================', '10ms | 50.0% | Group 1', '10ms | 50.0% | Group 2'].join('\n')
    );
  });

  test('should handle undefined names', () => {
    const logger = new TimeLogger();
    logger.session().start('');
    logger.level1().start('');
    logger.level2().start('');
    jest.advanceTimersByTime(10);
    logger.level2().end();
    logger.level1().end();
    logger.session().end();

    expect(logger.report).toBe(
      ['10ms | Session', '==============', '10ms |  100% | Level 1', '10ms |  100% |   Level 2'].join('\n')
    );
  });
});
