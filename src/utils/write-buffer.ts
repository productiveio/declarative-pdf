import {open} from 'fs/promises';
import type {FileHandle} from 'fs/promises';
// import { open, write, close } from 'fs';

export default async function writeBuffer(buffer: Buffer | Uint8Array, path: string): Promise<void> {
  let fileHandle: FileHandle | undefined;

  try {
    const writeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    fileHandle = await open(path, 'w');

    await fileHandle.write(new Uint8Array(writeBuffer));
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to write buffer to file');
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
}
