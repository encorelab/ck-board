import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import { Role, UserModel } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import dalUser from '../repository/dalUser';
import { NonceModel } from '../models/Nonce';
import dalNonce from '../repository/dalNonce';
import dalProject from '../repository/dalProject';
import { ProjectModel } from '../models/Project';
import { NotFoundError } from '../errors/client.errors';
import { addUserToProject } from './project.helpers';
import { ApplicationError } from '../errors/base.errors';
import { addToken, checkToken, sign, verify } from './jwt';

export interface Token {
  email: string;
  username: string;
  userID: string;
  role: string;
}

export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('No JWT Secret environtment variable defined!');
  }

  return secret;
};

export const addHours = (numOfHours: number, date = new Date()) => {
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
  return date;
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
    res.locals.user = verify(token);

    const cachedToken = await checkToken(res.locals.user.userID, token);
    if (cachedToken == null || cachedToken == 'invalid' || cachedToken == 'nil')
      return res.status(401).end('Invalid token!');

    next();
  } catch (e) {
    return res.status(401).end('Unable to authenticate!');
  }
};

export const isSsoEnabled = (): boolean => {
  return (
    process.env.SCORE_SSO_ENDPOINT != null &&
    process.env.SCORE_SSO_ENDPOINT != '' &&
    process.env.SCORE_SSO_SECRET != null &&
    process.env.SCORE_SSO_SECRET != ''
  );
};

export const generateSsoPayload = async (): Promise<string> => {
  const value = uuidv4();
  const nonce: NonceModel = {
    value: value,
  };
  const savedNonce = await dalNonce.create(nonce);
  const payload = `nonce=${savedNonce.value}`;
  return Buffer.from(payload).toString('base64');
};

export const generateHashedSsoPayload = (payload: string): string => {
  const secret = process.env.SCORE_SSO_SECRET;
  if (!secret) {
    throw new Error('No SCORE SSO Secret environment variable defined!');
  }
  return hmacSHA256(payload, secret).toString();
};

export const isCorrectHashedSsoPayload = (
  plainText: string,
  encodedText: string
): boolean => {
  const secret = process.env.SCORE_SSO_SECRET;
  if (!secret) {
    throw new Error('No SCORE SSO Secret environment variable defined!');
  }
  return hmacSHA256(plainText, secret).toString() === encodedText;
};

export const isValidNonce = async (nonce: string): Promise<boolean> => {
  const foundNonce = await dalNonce.findByValue(nonce);
  return foundNonce != null;
};

export const getParamMap = (params: string): Map<string, string> => {
  const paramMap = new Map<string, string>();
  const keyValuePairs = params.split('&');
  keyValuePairs.forEach((keyValuePair) => {
    // Get everything before the = as the key and everything after the = as the value
    const splitResult = keyValuePair.split(/=(.*)/);
    const [key, value] = splitResult;
    paramMap.set(key, value);
  });
  return paramMap;
};

export const getOrCreateUser = async (
  paramMap: Map<string, string>
): Promise<UserModel | null> => {
  const username = paramMap.get('username') ?? '';
  const email = `${username}@score.oise.utoronto.ca`;
  const role = getRole(paramMap.get('role'));
  try {
    return await createUserIfNecessary(email, username, role);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const createUserIfNecessary = async (
  email: string,
  username: string,
  role: Role
): Promise<UserModel> => {
  let userModel = await dalUser.findByEmail(email);
  if (userModel == null) {
    const password = uuidv4();
    userModel = await createUser(email, username, password, role);
  }
  return userModel;
};

export const createUser = async (
  email: string,
  username: string,
  password: string,
  role: Role
): Promise<UserModel> => {
  if (await dalUser.findByUsername(username)) {
    throw new Error(`User ${username} already exists!`);
  } else {
    const user: UserModel = {
      userID: uuidv4(),
      email: email,
      username: username,
      password: password,
      role: role,
    };
    return await dalUser.create(user);
  }
};

export const getRole = (role = ''): Role => {
  if (role.toUpperCase() === Role.TEACHER) {
    return Role.TEACHER;
  } else {
    return Role.STUDENT;
  }
};

export const getProjectIdFromUrl = (url: string): string | null => {
  const projectIDRegex = /\/project\/(.+?)(\/.*|$)/;
  const results = url.match(projectIDRegex);
  let projectID = null;
  if (results != null) {
    projectID = results[1];
  }
  return projectID;
};

export const joinProjectIfNecessary = async (
  userModel: UserModel,
  projectID: string
): Promise<ProjectModel> => {
  const project = await dalProject.getById(projectID);
  if (project != null) {
    const joinCode =
      getRole(userModel.role) == Role.STUDENT
        ? project.studentJoinCode
        : project.teacherJoinCode;
    return await addUserToProject(userModel, joinCode);
  }
  throw new NotFoundError(`Project with ID: ${projectID} not found!`);
};

export const signInUserWithSso = async (
  paramMap: Map<string, string>,
  res: Response
) => {
  const nonce = paramMap.get('nonce') ?? '';
  await dalNonce.remove(nonce);
  const userModel = await getOrCreateUser(paramMap);
  if (userModel == null) {
    return res.status(403).end('Error retrieving user. Please try again.');
  }
  const redirectUrl = paramMap.get('redirect-url') ?? '';
  const projectID = getProjectIdFromUrl(redirectUrl);
  if (projectID != null) {
    try {
      await joinProjectIfNecessary(userModel, projectID);
    } catch (e) {
      if (e instanceof ApplicationError)
        return res.status(e.statusCode).end(e.message);
      return res.status(500).end('Internal Server Error');
    }
  }
  const sessionToken = await generateSessionToken(userModel);
  sessionToken.redirectUrl = redirectUrl;
  await addToken(sessionToken.user.userID, sessionToken.token);

  res.cookie('CK_SESSION', sessionToken.token, {
    httpOnly: true,
    domain: process.env.APP_DOMAIN || 'localhost',
    expires: sessionToken.expiresAt,
    secure: true,
  });
  return res.status(200).send(sessionToken);
};

export const generateSessionToken = (userModel: UserModel): any => {
  const user = userToToken(userModel);
  const token = sign(user);
  const expiresAt = addHours(2);
  return { token, user, expiresAt };
};

export const logoutSCORE = async (req: Request) => {
  const scoreAddress = process.env.SCORE_SERVER_ADDRESS || 'http://localhost';
  return await axios.get(
    `${scoreAddress + process.env.SCORE_LOGOUT_ENDPOINT}`,
    {
      headers: { Cookie: `SESSION=${req.cookies['SESSION']};` },
    }
  );
};
