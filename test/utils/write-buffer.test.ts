/**
 * @jest-environment node
 */
import writeBuffer from '@app/utils/write-buffer';
import {open} from 'fs/promises';
import type {FileHandle} from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('writeBuffer', () => {
  // Setup mocks
  const mockWrite = jest.fn();
  const mockClose = jest.fn();
  const mockOpen = open as jest.MockedFunction<typeof open>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockOpen.mockResolvedValue({
      write: mockWrite,
      close: mockClose,
    } as unknown as FileHandle);
  });

  test('writes Buffer to file successfully', async () => {
    const buffer = Buffer.from('test data');
    const path = 'test.txt';

    await writeBuffer(buffer, path);

    expect(mockOpen).toHaveBeenCalledWith(path, 'w');
    expect(mockWrite).toHaveBeenCalledWith(new Uint8Array(buffer));
    expect(mockClose).toHaveBeenCalled();
  });

  test('writes Uint8Array to file successfully', async () => {
    const buffer = new Uint8Array([1, 2, 3]);
    const path = 'test.txt';

    await writeBuffer(buffer, path);

    expect(mockOpen).toHaveBeenCalledWith(path, 'w');
    expect(mockWrite).toHaveBeenCalledWith(new Uint8Array(Buffer.from(buffer)));
    expect(mockClose).toHaveBeenCalled();
  });

  test('closes file handle when write fails', async () => {
    const buffer = Buffer.from('test data');
    mockWrite.mockRejectedValueOnce(new Error('Write failed'));

    await expect(writeBuffer(buffer, 'test.txt')).rejects.toThrow('Write failed');
    expect(mockClose).toHaveBeenCalled();
  });

  test('throws generic error message for non-Error objects', async () => {
    const buffer = Buffer.from('test data');
    mockWrite.mockRejectedValueOnce('string error');

    await expect(writeBuffer(buffer, 'test.txt')).rejects.toThrow('Failed to write buffer to file');
    expect(mockClose).toHaveBeenCalled();
  });

  test('handles file open failure', async () => {
    const buffer = Buffer.from('test data');
    mockOpen.mockRejectedValueOnce(new Error('Open failed'));

    await expect(writeBuffer(buffer, 'test.txt')).rejects.toThrow('Open failed');
  });
});
