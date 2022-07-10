import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UserModel } from '../models/User';

export interface Token {
  email: string;
  username: string;
  userID: string;
  role: string;
}

export const addHours = (numOfHours: number, date = new Date()) => {
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
  return date;
};

export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('No JWT Secret environtment variable defined!');
  }

  return secret;
};

export const userToToken = (user: UserModel): Token => {
  return {
    email: user.email,
    username: user.username,
    userID: user.userID,
    role: user.role,
  };
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      return res.status(400).end('No authorization header found!');
    }

    const token = req.headers.authorization.replace('Bearer ', '');
    verify(token, getJWTSecret()) as Token;

    next();
  } catch (e) {
    return res.status(403).end('Unable to authenticate!');
  }
};
