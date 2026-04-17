import path from 'path';
import { fileURLToPath } from 'url';
import { runBuildContent } from './content-pipeline';

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFile = fileURLToPath(import.meta.url);

if (entryFile === currentFile) {
  await runBuildContent();
}
