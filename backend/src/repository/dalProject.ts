import { UnauthorizedError } from '../errors/client.errors';
import Project, { ProjectModel } from '../models/Project';
import mongoose from 'mongoose';
import dalBoard from './dalBoard';
import { Role } from '../models/User';

export const getById = async (id: string) => {
  try {
    const project = await Project.findOne({ projectID: id });
    return project;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUserId = async (id: string) => {
  try {
    const projects = await Project.find({ members: id });
    return projects;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByJoinCode = async (code: string, role: Role) => {
  try {
    if (role == Role.STUDENT) {
      return await Project.findOne({ studentJoinCode: code });
    } else {
      return await Project.findOne({ teacherJoinCode: code });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByConnectCode = async (code: string) => {
  try {
    return await Project.findOne({ scoreJoinCode: code });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const addStudent = async (code: string, userID: string) => {
  const project = await Project.findOne({ studentJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }
  if (!project.members.includes(userID)) {
    await project.updateOne({ $push: { members: userID } });
  }

  return project;
};

export const removeStudent = async (code: string, userID: string) => {
  const project = await Project.findOne({ studentJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }
  if (project.members.includes(userID)) {
    await project.updateOne({ $pull: { members: userID } });
  }

  return project;
  ``;
};

export const addTeacher = async (code: string, userID: string) => {
  const project = await Project.findOne({ teacherJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }
  if (!project.members.includes(userID)) {
    await project.updateOne({ $push: { teacherIDs: userID, members: userID } });
  }

  return project;
};

export const removeTeacher = async (code: string, userID: string) => {
  const project = await Project.findOne({ teacherJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }
  if (project.members.includes(userID)) {
    await project.updateOne({ $pull: { teacherIDs: userID, members: userID } });
  }

  return project;
};

export const create = async (project: ProjectModel) => {
  try {
    const savedProject = await Project.create(project);
    return savedProject;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, project: Partial<ProjectModel>) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { projectID: id },
      project,
      { new: true }
    );
    return updatedProject;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeBoard = async (id: string, boardID: string) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { projectID: id },
      { $pull: { boards: boardID } },
      { new: true }
    );
    return updatedProject;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deletedProject = await Project.findOneAndDelete({ projectID: id });
    if (deletedProject) {
      const boards = deletedProject.toObject().boards;
      for (const board in boards) {
        await dalBoard.remove(board);
      }
    }
    return deletedProject;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  } finally {
    await session.endSession();
  }
};

const dalProject = {
  getById,
  getByUserId,
  getByJoinCode,
  getByConnectCode,
  create,
  addStudent,
  removeStudent,
  addTeacher,
  removeTeacher,
  update,
  removeBoard,
  remove,
};

export default dalProject;
