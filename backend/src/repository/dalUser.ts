import User, { UserModel } from '../models/User';
import bcrypt from 'bcrypt';
import { FilterQuery } from 'mongoose';

export const findByUserID = async (userID: string) => {
  try {
    const user: UserModel | null = await User.findOne({ userID });
    return user;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const findByUserIDs = async (
  userIDs: string[],
  filter?: FilterQuery<UserModel>
) => {
  try {
    const users: UserModel[] = await User.find({
      userID: { $in: userIDs },
      ...filter,
    });
    return users;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const findByUsername = async (username: string) => {
  try {
    const user: UserModel | null = await User.findOne({ username });
    return user;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const findByEmail = async (email: string) => {
  try {
    const user: UserModel | null = await User.findOne({ email });
    return user;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (user: UserModel) => {
  try {
    const hashedPassword = bcrypt.hashSync(
      user.password,
      bcrypt.genSaltSync(10)
    );
    user.password = hashedPassword;

    const savedUser = await User.create(user);
    return savedUser;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, user: Partial<UserModel>) => {
  try {
    const updated = await User.findOneAndUpdate({ userID: id }, user);
    return updated;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalUser = {
  findByUserID,
  findByUserIDs,
  findByUsername,
  findByEmail,
  create,
  update,
};

export default dalUser;
