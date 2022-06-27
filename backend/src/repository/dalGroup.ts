import Group, { GroupModel } from '../models/Group';

export const getById = async (id: string) => {
  try {
    const group = await Group.findOne({ groupID: id });
    return group;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUserId = async (id: string) => {
  try {
    const groups = await Group.find({ members: id });
    return groups;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByProjectId = async (projectID: string) => {
  try {
    const groups = await Group.find({ projectID });
    return groups;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (group: GroupModel) => {
  try {
    const savedGroup = await Group.create(group);
    return savedGroup;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

// Add one or multiple users to a group
export const addUser = async (id: string, users: string[]) => {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { groupID: id },
      { $addToSet: { members: { $each: users } } },
      { new: true }
    );
    return updatedGroup;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

// Delete a group
export const remove = async (id: string) => {
  try {
    await Group.findOneAndDelete({ groupID: id });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

// Removing one or more users from a group
export const removeUser = async (id: string, users: string[]) => {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { groupID: id },
      { $pull: { members: { $in: users } } },
      { new: true }
    );
    return updatedGroup;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, group: Partial<GroupModel>) => {
  try {
    const updatedGroup = await Group.findOneAndUpdate({ groupID: id }, group, {
      new: true,
    });
    return updatedGroup;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalGroup = {
  getById,
  getByUserId,
  getByProjectId,
  create,
  addUser,
  remove,
  removeUser,
  update,
};

export default dalGroup;
