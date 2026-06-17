import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'module',
    },
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  mode: 'production',
  externalsType: 'module',
  externals: [
    /^.*\/variables\.js$/,
    /^.*\/slash-commands\/.*\.js$/,
  ],
};
