import { HttpErrorResponse } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';

export const generateUniqueID = () => {
  return uuidv4();
};

export const generateCode = (length) => {
  const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
};

export const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

export const numDigits = (x: number) => {
  return ((Math.log((x ^ (x >> 31)) - (x >> 31)) * Math.LOG10E) | 0) + 1;
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error instanceof HttpErrorResponse) return error.error;

  return String(error);
};

export const getErrorStatus = (error: unknown) => {
  if (error instanceof HttpErrorResponse) return error.status;

  return 500;
};

const utils = [getErrorMessage, shuffle, generateCode, generateUniqueID];

export default utils;
