import dotenv from 'dotenv';
import { dbURI } from './src/utils/mongo';
dotenv.config();

export = {
  mongodb: {
    url: dbURI(),
    databaseName: process.env.DB_NAME,
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
    },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.ts',
  useFileHash: false,
  moduleSystem: 'esm',
};
