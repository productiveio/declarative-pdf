import { open, write, close } from 'fs';

export default async function writeBuffer(
  buffer: Buffer | Uint8Array,
  path: string
) {
  return new Promise(function (resolve) {
    open(path, 'w', function (err: unknown, fd: number) {
      if (err) throw err;

      write(fd, buffer, 0, buffer.length, null, function (err: unknown) {
        if (err) throw err;

        close(fd, resolve);
      });
    });
  });
}
