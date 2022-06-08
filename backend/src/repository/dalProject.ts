import Project, { ProjectModel } from "../models/Project";

export const getById = async (id: string) => {
  try {
    const project = await Project.findOne({ projectID: id });
    return project;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByUserId = async (id: string) => {
  try {
    const projects = await Project.find({ members: id });
    return projects;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByJoinCode = async (code: string) => {
  try {
    const project = await Project.findOne({ joinCode: code });
    return project;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (project: ProjectModel) => {
  try {
    const savedProject = await Project.create(project);
    return savedProject;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
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
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalProject = {
  getById,
  getByUserId,
  getByJoinCode,
  create,
  update,
};

export default dalProject;
