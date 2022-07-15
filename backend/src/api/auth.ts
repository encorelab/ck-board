import { Router } from 'express';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dalUser from '../repository/dalUser';
import {
  addHours,
  generateHashedSsoPayload,
  generateSsoPayload,
  getJWTSecret,
  getParamMap,
  isAuthenticated,
  isCorrectHashedSsoPayload,
  isSsoEnabled,
  isValidNonce,
  signInUserWithSso,
  userToToken,
} from '../utils/auth';
import { UserModel } from '../models/User';

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
  const token = sign(user, getJWTSecret(), { expiresIn: '2h' });
  const expiresAt = addHours(2);

  res.status(200).send({ token, user, expiresAt });
});

router.post('/register', async (req, res) => {
  const body = req.body;

  const exists = await dalUser.findByUsername(body.username);
  if (exists) return res.sendStatus(400);

  const savedUser = await dalUser.create(body);

  const user = userToToken(savedUser);
  const token = sign(user, getJWTSecret(), { expiresIn: '2h' });
  const expiresAt = addHours(2);

  res.status(200).send({ token, user, expiresAt });
});

router.get('/is-sso-enabled', async (req, res) => {
  res.status(200).send({
    isSsoEnabled: isSsoEnabled(),
  });
});

router.get('/sso/handshake', async (req, res) => {
  const scoreSsoEndpoint = process.env.SCORE_SSO_ENDPOINT;
  const payload = await generateSsoPayload();
  const hashedPayload = generateHashedSsoPayload(payload);
  if (!scoreSsoEndpoint) {
    throw new Error('No SCORE SSO endpoint environment variable defined!');
  }
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
