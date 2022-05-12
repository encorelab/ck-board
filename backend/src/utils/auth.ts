import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { secret } from "../config/auth.config";
import { UserModel } from "../models/User";

export interface Token {
  email: string;
  username: string;
  userID: string;
  role: string;
}

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
      return res.status(400).end("No authorization header found!");
    }

    const token = req.headers.authorization.replace("Bearer ", "");
    verify(token, secret) as Token;

    next();
  } catch (e) {
    return res.status(403).end("Unable to authenticate!");
  }
};
