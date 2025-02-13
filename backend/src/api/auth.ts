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
import dalProject from '../repository/dalProject';
import { generateEmail } from '../utils/email';
import { generateUniqueID } from '../utils/Utils';

const router = Router();

interface ForgotPasswordRequest {
  email: string;
}

interface PasswordResetRequest {
  token: string;
  newPassword: string;
}

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
  const token = sign(user, getJWTSecret(), { expiresIn: '4h' });
  const expiresAt = addHours(2);

  res.status(200).send({ token, user, expiresAt });
});

router.post('/register', async (req, res) => {
  const body = req.body;

  const exists = await dalUser.findByUsername(body.username);
  if (exists) return res.sendStatus(400);

  const savedUser = await dalUser.create(body);

  const user = userToToken(savedUser);
  const token = sign(user, getJWTSecret(), { expiresIn: '4h' });
  const expiresAt = addHours(2);

  res.status(200).send({ token, user, expiresAt });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body as ForgotPasswordRequest;

    // 1. Validate the email
    if (!email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    // 2. Find the user by email
    const user = await dalUser.findByEmail(email);

    if (!user) {
      // Don't reveal if the user exists or not for security reasons
      return res.status(404).send({ message: 'No user found with that email' });
    }

    // 3. Generate a unique, one-time use token (e.g., using UUID)
    const resetToken = generateUniqueID();

    // 4. Store the token with an expiration time (e.g., 1 hour) in the database, associated with the user
    try {
      await dalUser.update(user.userID, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: addHours(1),
      });
    } catch (error) {
      console.error('Error updating user in database:', error);
      return res
        .status(500)
        .send({ message: 'An internal server error occurred.' });
    }

    // 5. Send an email to the user with a link containing the token
    const resetLink = `${process.env.CKBOARD_SERVER_ADDRESS}/reset-password?token=${resetToken}`;

    try {
      await generateEmail(email, 'Password Reset Request', resetLink);
      return res
        .status(200)
        .send({
          success: true,
          message:
            'If an account with that email exists, a password reset link has been sent.',
        });
    } catch (err) {
      return res
        .status(500)
        .send({
          success: false,
          message: 'There was an error sending the password reset email.',
        });
    }
  } catch (error) {
    console.error('Error in /forgot-password route:', error);
    return res
      .status(500)
      .send({ message: 'An internal server error occurred.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body as PasswordResetRequest;

  // 1. Find the user by the reset token
  const user = await dalUser.findByPasswordResetToken(token);

  if (
    !user ||
    !user.resetPasswordExpires ||
    user.resetPasswordExpires < new Date()
  ) {
    return res
      .status(400)
      .send({ message: 'Invalid or expired password reset token' });
  }

  // 2. Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10); // Use bcrypt

  // 3. Update the user's password and clear the reset token
  await dalUser.update(user.userID, {
    password: hashedPassword,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
  });

  res.status(200).send({ message: 'Password updated successfully' });
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

router.get('/project/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const project = await dalProject.getById(id);

  if (!project) {
    return res.sendStatus(404);
  }

  const users = await dalUser.findByUserIDs(project.members);
  res.status(200).json(users);
});

export default router;
