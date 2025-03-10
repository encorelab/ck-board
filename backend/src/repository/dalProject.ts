import { UnauthorizedError } from '../errors/client.errors';
import Project, { ProjectModel } from '../models/Project';
import mongoose from 'mongoose';
import dalBoard from './dalBoard';
import dalLearnerModel from './dalLearnerModel';
import { Role } from '../models/User';
import dalGroup from './dalGroup';
import dalUser from './dalUser';
import { addUserToWorkflows } from '../utils/project.helpers';

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

export const addStudent = async (code: string, userID: string) => {
  const project = await Project.findOne({ studentJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }

  // 1. Check if the user is already a member.  Prevent duplicates.
  if (project.members.includes(userID)) {
    return project; // Or throw an error, as appropriate.
  }

  // 2.  Get User and Check Role.
  const user = await dalUser.findByUserID(userID);
  if (!user) {
    throw new Error(`User with ID ${userID} not found.`);
  }
  if (user.role !== Role.STUDENT) {
    throw new Error('Invalid Permissions');
  }

  // 3. Add to project
  project.members.push(userID);
  await project.save();

  // 4. Find/Create "All Students" group
  let allStudentsGroup = await dalGroup.getAllStudentsGroup(project.projectID);
  if (!allStudentsGroup) {
    allStudentsGroup = await dalGroup.create({
      groupID: 'all-students-' + project.projectID,
      projectID: project.projectID,
      members: [],
      name: 'All Students',
      isDefault: true,
    });
  }

  // 5. Add to "All Students" group and call a function to the user to existing workflows
  await dalGroup.addUser(allStudentsGroup.groupID, [userID]);
  await addUserToWorkflows(allStudentsGroup.groupID, userID);

  return project;
};

export const addTeacher = async (code: string, userID: string) => {
  const project = await Project.findOne({ teacherJoinCode: code });
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }
  await project.updateOne({ $push: { teacherIDs: userID, members: userID } });

  return project;
};

export const create = async (project: ProjectModel) => {
  try {
    const savedProject = await Project.create(project);
    await dalLearnerModel.createDefaultModels(project.projectID);

    // Create "All Students" group after project creation
    let allStudentsGroup = await dalGroup.getAllStudentsGroup(savedProject.projectID);
    if (!allStudentsGroup) {
      await dalGroup.create({
        groupID: 'all-students-' + savedProject.projectID,
        projectID: savedProject.projectID,
        members: [], // Initially empty, students are added when they join
        name: 'All Students',
        isDefault: true,
      });
    }

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
  create,
  addStudent,
  addTeacher,
  update,
  removeBoard,
  remove,
};

export default dalProject;
