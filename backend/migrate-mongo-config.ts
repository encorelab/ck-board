import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.DB_URI);

export = {
  mongodb: {
    url: process.env.DB_URI,
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
