import { NotFoundError } from '../errors/client.errors';
import Project, { ProjectModel } from '../models/Project';

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

export const addStudent = async (code: string, userID: string) => {
  const project = await Project.findOne({ studentJoinCode: code });
  if (!project) {
    throw new NotFoundError('Invalid Join Code!');
  }
  await project.updateOne({ $push: { members: userID } });

  return project;
}

export const addTeacher = async (code: string, userID: string) => {
  const project = await Project.findOne({ teacherJoinCode: code });
  if (!project) {
    throw new NotFoundError('Invalid Join Code!');
  }
  await project.updateOne({ $push: { teacherIDs: userID, members: userID } });

  return project;
}

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

const dalProject = {
  getById,
  getByUserId,
  create,
  addStudent,
  addTeacher,
  update,
  removeBoard,
};

export default dalProject;
