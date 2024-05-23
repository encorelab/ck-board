import * as dotenv from 'dotenv'; 
dotenv.config();

export const environment = {
  production: true,
  backendUrl: `http://localhost:${process.env['PORT']}`
};
