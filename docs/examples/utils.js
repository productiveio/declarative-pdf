import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function write(name, buffer) {
  return writeFile(path.join(__dirname, name), buffer);
}

export function read(name) {
  return readFile(path.join(__dirname, name), {encoding: 'utf-8'});
}
