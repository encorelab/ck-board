import redis from './redis';
import jwt from 'jsonwebtoken';
import { Token } from './auth';

export const sign = (payload: Token, date = new Date()) => {
  return jwt.sign(payload, 'secret', {
    expiresIn: date.setTime(date.getTime() + 2 * 60 * 60 * 1000),
  });
};

export const verify = (token: string): Token => {
  return jwt.verify(token, 'secret') as Token;
};

export const addToken = async (
  id: string,
  token: string,
  date = new Date()
) => {
  const key = `${id}_${token}`;
  const check = await redis.EXISTS(key); // check if key exists in cache
  if (check == 1) return;

  await redis.SET(key, 'valid'); // set key value to be 'valid'
  await redis.EXPIREAT(key, date.setTime(date.getTime() + 2 * 60 * 60 * 1000)); // set expiry date for the key in the cache
  return;
};

export const checkToken = async (id: string, token: string) => {
  const key = `${id}_${token}`;
  const status = redis.GET(key); // get the token from the cache and return its value
  return status;
};

export const destroyToken = async (id: string, token: string) => {
  const key = `${id}_${token}`;
  await redis.DEL(key); // deletes token from cache
  return;
};
