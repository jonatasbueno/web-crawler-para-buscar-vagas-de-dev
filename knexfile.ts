import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'db.sqlite')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'src/db/migrations'),
    extension: 'ts',
    loadExtensions: ['.ts']
  }
};

export default config;
