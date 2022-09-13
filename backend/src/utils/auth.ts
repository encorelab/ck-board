import { NextFunction, Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';
import { Role, UserModel } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import dalUser from '../repository/dalUser';
import { NonceModel } from '../models/Nonce';
import dalNonce from '../repository/dalNonce';
import dalProject from '../repository/dalProject';
import { ProjectModel } from '../models/Project';

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
    res.locals.user = verify(token, getJWTSecret()) as Token;

    next();
  } catch (e) {
    return res.status(403).end('Unable to authenticate!');
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
    const [key, value] = keyValuePair.split('=');
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
): Promise<ProjectModel | null> => {
  const project = await dalProject.getById(projectID);
  if (project != null) {
    const members: string[] = project.members;
    if (!members.includes(userModel.userID)) {
      members.push(userModel.userID);
      return await dalProject.update(projectID, project);
    }
  }
  return null;
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
    await joinProjectIfNecessary(userModel, projectID);
  }
  const sessionToken = generateSessionToken(userModel);
  sessionToken.redirectUrl = redirectUrl;
  return res.status(200).send(sessionToken);
};

export const generateSessionToken = (userModel: UserModel): any => {
  const user = userToToken(userModel);
  const token = sign(user, getJWTSecret(), { expiresIn: '2h' });
  const expiresAt = addHours(2);
  return { token, user, expiresAt };
};
