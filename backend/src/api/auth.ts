import { Router } from 'express';
import bcrypt from 'bcrypt';
import dalUser from '../repository/dalUser';
import {
  addHours,
  generateHashedSsoPayload,
  generateSsoPayload,
  getParamMap,
  isAuthenticated,
  isCorrectHashedSsoPayload,
  isSsoEnabled,
  isValidNonce,
  logoutSCORE,
  signInUserWithSso,
  userToToken,
} from '../utils/auth';
import { UserModel } from '../models/User';
import { addToken, destroyToken, sign } from '../utils/jwt';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).end('Email and password are required.');
  }

  const foundUser = await dalUser.findByEmail(email);
  if (!foundUser) {
    return res.status(404).end('Invalid email. Please try again.');
  }

  const isValidPassword = await bcrypt.compare(password, foundUser.password);
  if (!isValidPassword) {
    return res.status(403).end('Invalid password. Please try again.');
  }

  const user = userToToken(foundUser);
  const token = sign(user);
  const expiresAt = addHours(2);

  await addToken(foundUser.userID, token);
  res.status(200).send({ token, user, expiresAt });
});

router.post('/register', async (req, res) => {
  const body = req.body;

  const exists = await dalUser.findByUsername(body.username);
  if (exists) return res.sendStatus(400);

  const savedUser = await dalUser.create(body);

  const user = userToToken(savedUser);
  const token = sign(user);
  const expiresAt = addHours(2);

  await addToken(savedUser.userID, token);
  res.status(200).send({ token, user, expiresAt });
});

router.post('/logout', isAuthenticated, async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(400).end('No authorization header found!');
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  await destroyToken(res.locals.user.userID, token);

  if (req.body.logoutSCORE) {
    await logoutSCORE(req);
  }

  res.status(200).end();
});

router.post('/multiple', async (req, res) => {
  const ids = req.body;
  const users = await dalUser.findByUserIDs(ids);
  res.status(200).json(users);
});

router.get('/is-sso-enabled', async (req, res) => {
  res.status(200).send({
    isSsoEnabled: isSsoEnabled(),
  });
});

router.get('/sso/handshake', async (req, res) => {
  const ssoEndpoint = process.env.SCORE_SSO_ENDPOINT;
  const scoreAddress = process.env.SCORE_SERVER_ADDRESS || 'http://localhost';
  if (!ssoEndpoint) {
    throw new Error('No SCORE SSO endpoint environment variable defined!');
  }
  const scoreSsoEndpoint = `${scoreAddress + ssoEndpoint}`;
  const payload = await generateSsoPayload();
  const hashedPayload = generateHashedSsoPayload(payload);
  res.status(200).send({
    scoreSsoEndpoint: scoreSsoEndpoint,
    sig: hashedPayload,
    sso: payload,
  });
});

router.get('/sso/login/:sso/:sig', async (req, res) => {
  const sso = req.params.sso;
  const sig = req.params.sig;
  if (isCorrectHashedSsoPayload(sso, sig)) {
    const payload = Buffer.from(sso, 'base64').toString('ascii');
    const paramMap: Map<string, string> = getParamMap(payload);
    const nonce = paramMap.get('nonce');
    if (nonce != null && (await isValidNonce(nonce))) {
      return signInUserWithSso(paramMap, res);
    } else {
      return res.status(403).end('Invalid nonce. Please try again.');
    }
  } else {
    return res.status(403).end('Invalid hash. Please try again.');
  }
});

router.post('/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;

  const { username, role } = req.body;

  const user: Partial<UserModel> = Object.assign(
    {},
    username === null ? null : { username },
    role === null ? null : { role }
  );

  const update = await dalUser.update(id, user);
  res.status(200).json(update);
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const user = await dalUser.findByUserID(id);

  if (!user) {
    return res.sendStatus(404);
  }

  res.status(200).json(user);
});

export default router;
