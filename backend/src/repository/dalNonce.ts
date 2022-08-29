import Nonce from '../models/Nonce';
import Nonces, { NonceModel } from '../models/Nonce';

export const findByValue = async (nonce: string) => {
  try {
    const myNonce: NonceModel | null = await Nonces.findOne({ value: nonce });
    return myNonce;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (nonce: NonceModel) => {
  try {
    const savedNonce = await Nonce.create(nonce);
    return savedNonce;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (nonce: string) => {
  try {
    const deletedNonce = await Nonces.findOneAndDelete({ value: nonce });
    return deletedNonce;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalNonce = {
  create,
  findByValue,
  remove,
};

export default dalNonce;
