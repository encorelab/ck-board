import { mongo } from 'mongoose';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/client.errors';
import { InternalServerError } from '../errors/server.errors';
import { BoardScope, BoardType } from '../models/Board';
import Project, { ProjectModel } from '../models/Project';
import { Role, UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalLearnerModel from '../repository/dalLearnerModel';
import dalProject from '../repository/dalProject';
import dalUser from '../repository/dalUser';
import {
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from './board.helpers';

export async function addUserToProject(
  user: UserModel,
  code: string
): Promise<ProjectModel> {
  const userDocument = await dalUser.findByUserID(user.userID);
  if (!userDocument) {
    throw new NotFoundError('User not found!');
  }

  const project = await dalProject.getByJoinCode(code, user.role);
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }

  if (project.membershipDisabled) {
    throw new ForbiddenError('Project membership is currently disabled!');
  }

  let updatedProject;
  if (user.role === Role.STUDENT) {
    updatedProject = await dalProject.addStudent(code, user.userID);
  } else if (user.role === Role.TEACHER) {
    updatedProject = await dalProject.addTeacher(code, user.userID);
  } else {
    throw new InternalServerError('No role associated with user!');
  }

  if (updatedProject.personalBoardSetting.enabled) {
    const image = updatedProject.personalBoardSetting.bgImage;
    const boardID = new mongo.ObjectId().toString();
    await dalBoard.create({
      projectID: updatedProject.projectID,
      boardID: boardID,
      ownerID: user.userID,
      name: `${user.username}'s Personal Board`,
      scope: BoardScope.PROJECT_PERSONAL,
      task: undefined,
      permissions: getDefaultBoardPermissions(),
      type: BoardType.BRAINSTORMING,
      bgImage: image,
      tags: getDefaultBoardTags(boardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
    });
    updatedProject = await Project.findOneAndUpdate(
      { projectID: updatedProject.projectID },
      { $push: { boards: boardID } },
      { new: true }
    );
    if (updatedProject == null)
      throw new InternalServerError(
        'Unable to update project with new personal board!'
      );
  }

  if (user.role == Role.STUDENT) {
    const models = await dalLearnerModel.getByBoards(project.boards);
    for (const model of models) {
      const dimValues = [];
      for (const dimension of model.dimensions) {
        dimValues.push({
          student: userDocument,
          dimension: dimension,
          diagnostic: 0,
          reassessment: 0,
        });
      }
      await dalLearnerModel.addDimensionValues(model.modelID, dimValues);
    }
  }

  return updatedProject;
}
