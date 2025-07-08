import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateUniqueID = () => {
  return uuidv4();
};

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const STUDENT_POST_COLOR = '#FFF7C0';
export const TEACHER_POST_COLOR = '#BBC4F7';
